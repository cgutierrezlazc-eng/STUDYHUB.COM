/**
 * Tests del componente LexicalEditor.
 * Fase RED: se crean antes de la implementación completa.
 * Nota: Lexical + jsdom tiene limitaciones con Selection API.
 * Se usa smoke test y verificación de estructura, no interacción compleja.
 *
 * Se usa getByRole/getByTestId desde el resultado de render()
 * en lugar de screen, porque @testing-library/dom no está instalado
 * como paquete separado en este proyecto.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import LexicalEditor from '../Editor/LexicalEditor';

// Lexical usa ResizeObserver — mock necesario en jsdom
vi.stubGlobal(
  'ResizeObserver',
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
);

describe('LexicalEditor — smoke tests', () => {
  it('renderiza sin crash', () => {
    const { container } = render(<LexicalEditor onChange={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('renderiza el área de edición con rol textbox', () => {
    const { getByRole } = render(<LexicalEditor onChange={() => {}} />);
    const editable = getByRole('textbox');
    expect(editable).toBeInTheDocument();
  });

  it('el área editable tiene contenteditable=true', () => {
    const { getByRole } = render(<LexicalEditor onChange={() => {}} />);
    const editable = getByRole('textbox');
    expect(editable).toHaveAttribute('contenteditable', 'true');
  });

  it('renderiza la toolbar', () => {
    const { container } = render(<LexicalEditor onChange={() => {}} />);
    const toolbar = container.querySelector('[data-testid="workspace-toolbar"]');
    expect(toolbar).toBeInTheDocument();
  });

  it('acepta prop className sin crash', () => {
    const { container } = render(<LexicalEditor onChange={() => {}} className="my-editor" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('acepta placeholder sin crash', () => {
    const { getByRole } = render(
      <LexicalEditor onChange={() => {}} placeholder="Escribe aquí..." />
    );
    // El placeholder puede no aparecer inmediatamente — solo verificamos que no crashea
    expect(getByRole('textbox')).toBeInTheDocument();
  });
});
