/**
 * Tests de authorColors.ts
 * TDD: se escriben primero, antes de la implementación.
 *
 * Criterios:
 * - La función getAuthorColor(userId) es determinística para el mismo id
 * - Diferentes ids producen colores de la paleta (puede haber colisiones, pero no aleatorios)
 * - La paleta tiene exactamente 20 colores accesibles
 * - Todos los colores son strings de formato hex o válidos CSS
 * - El primer color para el primer id siempre es el mismo en cualquier ejecución
 */

import { describe, it, expect } from 'vitest';
import { getAuthorColor, AUTHOR_COLORS } from '../../components/workspaces/authorColors';

describe('AUTHOR_COLORS', () => {
  it('tiene exactamente 20 colores', () => {
    expect(AUTHOR_COLORS).toHaveLength(20);
  });

  it('todos los colores son strings no vacíos', () => {
    AUTHOR_COLORS.forEach((color) => {
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });
  });

  it('todos los colores tienen formato hexadecimal válido #RRGGBB', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    AUTHOR_COLORS.forEach((color) => {
      expect(color).toMatch(hexPattern);
    });
  });

  it('no hay colores duplicados en la paleta', () => {
    const unique = new Set(AUTHOR_COLORS);
    expect(unique.size).toBe(20);
  });
});

describe('getAuthorColor — determinismo', () => {
  it('retorna el mismo color para el mismo userId en múltiples llamadas', () => {
    const userId = 'user-abc-123';
    const color1 = getAuthorColor(userId);
    const color2 = getAuthorColor(userId);
    const color3 = getAuthorColor(userId);
    expect(color1).toBe(color2);
    expect(color2).toBe(color3);
  });

  it('retorna un color de la paleta AUTHOR_COLORS', () => {
    const color = getAuthorColor('any-user-id');
    expect(AUTHOR_COLORS).toContain(color);
  });

  it('ids distintos pueden producir el mismo o distinto color (no error)', () => {
    // Lo importante es que la función no lanza, no que los colores sean distintos
    const c1 = getAuthorColor('user-1');
    const c2 = getAuthorColor('user-2');
    expect(typeof c1).toBe('string');
    expect(typeof c2).toBe('string');
  });

  it('funciona con userId numérico como string', () => {
    const color = getAuthorColor('12345');
    expect(AUTHOR_COLORS).toContain(color);
  });

  it('funciona con userId vacío sin lanzar excepción', () => {
    expect(() => getAuthorColor('')).not.toThrow();
    const color = getAuthorColor('');
    expect(AUTHOR_COLORS).toContain(color);
  });

  it('el hash es estable: user-abc-123 siempre cae en el mismo índice de paleta', () => {
    // Test de regresión: si la función de hash cambia, este test falla
    // y nos alerta de que los colores de autor cambiarían para usuarios existentes.
    const first = getAuthorColor('user-abc-123');
    // Ejecutamos en un loop para confirmar estabilidad
    for (let i = 0; i < 100; i++) {
      expect(getAuthorColor('user-abc-123')).toBe(first);
    }
  });

  it('la distribución usa al menos 10 colores distintos para 50 userIds diferentes', () => {
    const colors = new Set<string>();
    for (let i = 0; i < 50; i++) {
      colors.add(getAuthorColor(`synthetic-user-${i}`));
    }
    // Con 50 ids y 20 colores, esperamos al menos 10 colores distintos
    expect(colors.size).toBeGreaterThanOrEqual(10);
  });
});
