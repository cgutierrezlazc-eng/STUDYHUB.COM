/**
 * BUG-02 — Verifica que Login.tsx y Register.tsx NO contengan
 * links rotos a /terminos o /privacidad.
 *
 * Este test es estático: lee el contenido del archivo fuente y comprueba
 * que las rutas rotas no aparezcan. Una vez que BUG-02 está arreglado,
 * este test actúa como guardia de regresión.
 *
 * Bloque: legal-viewer-v1
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_ROOT = path.resolve(__dirname, '../../../src/pages');

function readPageSource(filename: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, filename), 'utf-8');
}

describe('BUG-02 — sin links rotos en páginas de autenticación', () => {
  it('Login.tsx no tiene href="/terminos"', () => {
    const src = readPageSource('Login.tsx');
    expect(src).not.toMatch(/href=["']\/terminos["']/);
  });

  it('Login.tsx no tiene href="/privacidad"', () => {
    const src = readPageSource('Login.tsx');
    expect(src).not.toMatch(/href=["']\/privacidad["']/);
  });

  it('Register.tsx no tiene href="/terminos"', () => {
    const src = readPageSource('Register.tsx');
    expect(src).not.toMatch(/href=["']\/terminos["']/);
  });

  it('Register.tsx no tiene href="/privacidad"', () => {
    const src = readPageSource('Register.tsx');
    expect(src).not.toMatch(/href=["']\/privacidad["']/);
  });

  it('Login.tsx contiene referencia a /terms o LegalLinksFooter', () => {
    const src = readPageSource('Login.tsx');
    const hasFixedRoute = src.includes('/terms') || src.includes('LegalLinksFooter');
    expect(hasFixedRoute).toBe(true);
  });

  it('Register.tsx contiene referencia a /terms o LegalLinksFooter', () => {
    const src = readPageSource('Register.tsx');
    const hasFixedRoute = src.includes('/terms') || src.includes('LegalLinksFooter');
    expect(hasFixedRoute).toBe(true);
  });
});
