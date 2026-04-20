/**
 * Test N12 — validación de tokens CSS del design system v3.
 *
 * Verifica que el archivo design-system-v3.css declare las variables
 * esperadas dentro del selector .v3-surface.
 *
 * TDD aplicado: test escrito ANTES de crear el archivo CSS.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSS_PATH = resolve(__dirname, '../../styles/design-system-v3.css');

describe('design-system-v3.css — tokens', () => {
  let cssContent = '';

  beforeAll(() => {
    cssContent = readFileSync(CSS_PATH, 'utf-8');
  });

  const requiredVariables = [
    '--ink',
    '--ink-2',
    '--ink-3',
    '--ink-4',
    '--paper',
    '--paper-2',
    '--paper-3',
    '--line',
    '--lime',
    '--lime-ink',
    '--pink',
    '--pink-deep',
    '--orange',
    '--cream',
    '--violet',
    '--cyan',
    '--blue',
    '--font-display',
    '--font-mono',
    '--ease',
    '--r-btn',
    '--r-card',
    '--r-xl',
    '--shadow-sm',
    '--shadow-md',
  ];

  it('el archivo CSS existe y no está vacío', () => {
    expect(cssContent).toBeTruthy();
    expect(cssContent.length).toBeGreaterThan(100);
  });

  it('declara el selector .v3-surface', () => {
    expect(cssContent).toContain('.v3-surface');
  });

  requiredVariables.forEach((variable) => {
    it(`declara la variable ${variable}`, () => {
      expect(cssContent).toContain(variable);
    });
  });

  it('tiene al menos 25 variables CSS', () => {
    const matches = cssContent.match(/^\s*--[\w-]+:/gm);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(25);
  });

  it('NO contamina :root con variables v3 (están dentro de .v3-surface)', () => {
    // Verifica que las variables estén dentro de .v3-surface y no en :root directamente
    // La estrategia: si el archivo tiene :root { ... --ink: ... }, eso sería contaminación
    // El archivo puede tener :root solo para selection/scrollbar, no para --ink
    const rootBlock = cssContent.match(/:root\s*\{([^}]*)\}/s);
    if (rootBlock) {
      expect(rootBlock[1]).not.toContain('--ink:');
      expect(rootBlock[1]).not.toContain('--paper:');
      expect(rootBlock[1]).not.toContain('--lime:');
    }
  });
});
