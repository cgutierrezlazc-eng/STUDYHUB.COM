/**
 * Test N8 — Smoke test de LandingV3
 *
 * TDD RED: escrito antes de crear LandingV3.tsx
 *
 * Verifica:
 * 1. Renderiza sin crash
 * 2. No contiene strings prohibidas en el DOM ("IA", "AI", voseo)
 * 3. No contiene estadísticas inventadas (números seguidos de k/M/★)
 * 4. Contiene la clase v3-surface
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock de onNavigate para evitar dependencia de Router
const mockOnLogin = vi.fn();
const mockOnRegister = vi.fn();

describe('LandingV3 — smoke tests', () => {
  it('renderiza sin crash', async () => {
    const { default: LandingV3 } = await import('../../pages/v3/LandingV3');
    expect(() =>
      render(<LandingV3 onLogin={mockOnLogin} onRegister={mockOnRegister} />)
    ).not.toThrow();
  });

  it('no contiene "IA" ni "AI" ni "inteligencia artificial" en el DOM', async () => {
    const { default: LandingV3 } = await import('../../pages/v3/LandingV3');
    const { container } = render(<LandingV3 onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    // Busca en el textContent del contenedor (no en atributos ni comentarios)
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\bIA\b/);
    expect(text).not.toMatch(/\bAI\b/);
    expect(text).not.toMatch(/inteligencia artificial/i);
  });

  it('no contiene voseo rioplatense en el DOM', async () => {
    const { default: LandingV3 } = await import('../../pages/v3/LandingV3');
    const { container } = render(<LandingV3 onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/necesitás|tenés|querés|sabés|con vos\b/);
  });

  it('no contiene estadísticas inventadas (números seguidos de k, M o ★)', async () => {
    const { default: LandingV3 } = await import('../../pages/v3/LandingV3');
    const { container } = render(<LandingV3 onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    const text = container.textContent ?? '';
    // Prohíbe: "+70k", "2.1k", "4.9★", "2.8M", "19.6M", "127 estudiando"
    expect(text).not.toMatch(/\d+k\b/i);
    expect(text).not.toMatch(/\d+M\b/);
    expect(text).not.toMatch(/\d+\.\d+★/);
  });

  it('contiene un elemento con clase v3-surface', async () => {
    const { default: LandingV3 } = await import('../../pages/v3/LandingV3');
    const { container } = render(<LandingV3 onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    expect(container.querySelector('.v3-surface')).not.toBeNull();
  });

  it('tiene botones de acción accesibles (CTA)', async () => {
    const { default: LandingV3 } = await import('../../pages/v3/LandingV3');
    render(<LandingV3 onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    // Debe haber al menos un botón visible
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('no menciona competidores por nombre', async () => {
    const { default: LandingV3 } = await import('../../pages/v3/LandingV3');
    const { container } = render(<LandingV3 onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/Moodle|Crehana|Udemy|LinkedIn Learning|Canvas|Notion/i);
  });
});
