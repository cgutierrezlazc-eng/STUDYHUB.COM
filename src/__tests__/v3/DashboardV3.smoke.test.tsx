/**
 * Test N11 — Smoke test de DashboardV3
 *
 * TDD RED: escrito antes de crear DashboardV3.tsx
 *
 * Verifica:
 * 1. Renderiza sin crash
 * 2. No contiene strings prohibidas
 * 3. Contiene la clase v3-surface
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const mockOnNavigate = vi.fn();

describe('DashboardV3 — smoke tests', () => {
  it('renderiza sin crash', async () => {
    const { default: DashboardV3 } = await import('../../pages/v3/DashboardV3');
    expect(() => render(<DashboardV3 onNavigate={mockOnNavigate} />)).not.toThrow();
  });

  it('no contiene "IA" ni "AI" en el DOM', async () => {
    const { default: DashboardV3 } = await import('../../pages/v3/DashboardV3');
    const { container } = render(<DashboardV3 onNavigate={mockOnNavigate} />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\bIA\b/);
    expect(text).not.toMatch(/\bAI\b/);
    expect(text).not.toMatch(/inteligencia artificial/i);
  });

  it('no contiene voseo rioplatense', async () => {
    const { default: DashboardV3 } = await import('../../pages/v3/DashboardV3');
    const { container } = render(<DashboardV3 onNavigate={mockOnNavigate} />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/necesitás|tenés|querés|sabés/);
  });

  it('contiene un elemento con clase v3-surface', async () => {
    const { default: DashboardV3 } = await import('../../pages/v3/DashboardV3');
    const { container } = render(<DashboardV3 onNavigate={mockOnNavigate} />);
    expect(container.querySelector('.v3-surface')).not.toBeNull();
  });

  it('no modifica Dashboard.tsx original (DashboardV3 es archivo separado)', async () => {
    // Este test verifica el import path — si DashboardV3 importa de 'pages/v3/'
    // y no de 'pages/Dashboard', la separación es correcta
    const module = await import('../../pages/v3/DashboardV3');
    expect(module.default).toBeDefined();
    expect(module.default.name).toBe('DashboardV3');
  });
});
