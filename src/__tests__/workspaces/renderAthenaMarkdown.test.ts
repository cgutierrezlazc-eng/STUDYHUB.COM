/**
 * Tests unitarios puros del helper renderAthenaMarkdown.
 * Verifica: escape HTML (XSS), negrita, itálica, listas, secciones.
 *
 * Bloque 2c Athena IA.
 */

import { describe, it, expect } from 'vitest';
import { renderAthenaMarkdown } from '../../components/workspaces/Athena/renderAthenaMarkdown';

describe('renderAthenaMarkdown', () => {
  it('devuelve string vacío para input vacío', () => {
    expect(renderAthenaMarkdown('')).toBe('');
  });

  it('escapa < y > para prevenir XSS básico', () => {
    const result = renderAthenaMarkdown('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapa img con onerror para prevenir XSS', () => {
    const result = renderAthenaMarkdown('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('escapa svg con onload para prevenir XSS', () => {
    const result = renderAthenaMarkdown('<svg onload=alert(1)>');
    expect(result).not.toContain('<svg');
    expect(result).toContain('&lt;svg');
  });

  it('convierte **texto** a <strong>texto</strong>', () => {
    const result = renderAthenaMarkdown('Este es **importante**.');
    expect(result).toContain('<strong>importante</strong>');
  });

  it('convierte *texto* a <em>texto</em>', () => {
    const result = renderAthenaMarkdown('Esto es *itálica*.');
    expect(result).toContain('<em>itálica</em>');
  });

  it('no confunde **x** con *x* (negrita primero)', () => {
    const result = renderAthenaMarkdown('**negrita** y *itálica*');
    expect(result).toContain('<strong>negrita</strong>');
    expect(result).toContain('<em>itálica</em>');
  });

  it('convierte líneas con "- " en lista <ul>', () => {
    const input = '- Primero\n- Segundo\n- Tercero';
    const result = renderAthenaMarkdown(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
    expect(result).toContain('Primero');
    expect(result).toContain('Segundo');
    expect(result).toContain('</ul>');
  });

  it('convierte líneas con "1. " en lista <ol>', () => {
    const input = '1. Primero\n2. Segundo\n3. Tercero';
    const result = renderAthenaMarkdown(input);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>');
    expect(result).toContain('Primero');
    expect(result).toContain('</ol>');
  });

  it('mantiene CORRECCIONES en mayúsculas como texto visible', () => {
    const result = renderAthenaMarkdown('CORRECCIONES\n- Falta acento');
    expect(result).toContain('CORRECCIONES');
  });

  it('escapa & correctamente', () => {
    const result = renderAthenaMarkdown('Ley 19.496 & Reglamento');
    expect(result).toContain('&amp;');
    expect(result).not.toContain('& Reglamento');
  });
});
