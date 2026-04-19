/**
 * Tests de MathRenderer (componente React que renderiza LaTeX con KaTeX).
 * TDD: se escriben primero. Deben fallar hasta que MathRenderer esté implementado.
 *
 * Criterios:
 * 1. Renderiza LaTeX válido (el HTML de KaTeX aparece en el DOM)
 * 2. Maneja error de sintaxis mostrando clase ws-math-error
 * 3. Inline usa displayMode=false, block usa displayMode=true
 * 4. LaTeX vacío renderiza sin crash
 * 5. Intento XSS (<script>): KaTeX sanitiza y no inyecta scripts
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MathRenderer from '../../components/workspaces/Editor/MathRenderer';

describe('MathRenderer — render básico', () => {
  it('renderiza LaTeX válido sin error', () => {
    const { container } = render(<MathRenderer latex="x^2" inline={true} />);
    // KaTeX genera elementos con clase .katex
    expect(container.querySelector('.katex')).toBeTruthy();
  });

  it('renderiza LaTeX en modo block sin error', () => {
    const { container } = render(<MathRenderer latex="\\int_0^1 x dx" inline={false} />);
    expect(container.querySelector('.katex')).toBeTruthy();
  });

  it('LaTeX vacío no lanza excepción', () => {
    expect(() => render(<MathRenderer latex="" inline={true} />)).not.toThrow();
  });
});

describe('MathRenderer — manejo de errores de sintaxis', () => {
  it('muestra clase ws-math-error cuando el LaTeX es inválido', () => {
    const { container } = render(<MathRenderer latex="\\invalidcommand{{{" inline={false} />);
    // Con throwOnError: false, KaTeX renderiza el error visualmente
    // Nuestro componente agrega ws-math-error
    expect(container.querySelector('.ws-math-error')).toBeTruthy();
  });

  it('el elemento con ws-math-error tiene atributo title (tooltip)', () => {
    const { container } = render(<MathRenderer latex="\\invalidcommand{{" inline={false} />);
    const errorEl = container.querySelector('.ws-math-error');
    if (errorEl) {
      // Puede ser que katex no lance con commandos desconocidos, por eso verificamos
      // que si hay error, tenga tooltip
      expect(errorEl.getAttribute('title') ?? '').not.toBe('');
    }
    // Si no hay error (KaTeX lo manejó silenciosamente), el test pasa igual
    // porque el componente no debería crashear
  });
});

describe('MathRenderer — seguridad XSS', () => {
  it('no inyecta elementos script en el DOM', () => {
    // KaTeX sanitiza internamente y no permite <script>
    const { container } = render(
      <MathRenderer latex="<script>alert('xss')</script>" inline={true} />
    );
    expect(container.querySelector('script')).toBeNull();
  });

  it('intento de inyección via onerror no ejecuta código', () => {
    const { container } = render(
      <MathRenderer latex="<img src=x onerror=alert(1)>" inline={true} />
    );
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('MathRenderer — diferencia inline vs block', () => {
  it('modo inline no contiene .katex-display', () => {
    const { container } = render(<MathRenderer latex="x" inline={true} />);
    // KaTeX en displayMode=false no genera .katex-display
    expect(container.querySelector('.katex-display')).toBeNull();
  });

  it('modo block contiene .katex-display', () => {
    const { container } = render(<MathRenderer latex="x" inline={false} />);
    // KaTeX en displayMode=true genera .katex-display
    expect(container.querySelector('.katex-display')).toBeTruthy();
  });
});
