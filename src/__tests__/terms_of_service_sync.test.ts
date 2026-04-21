/**
 * terms_of_service_sync.test.ts
 *
 * Pieza 1 del bloque bloque-legal-consolidation-v2.
 *
 * Valida invariantes que deben cumplirse simultáneamente en las dos
 * vistas de los Términos y Condiciones:
 *
 *  - src/pages/TermsOfService.tsx         (página pública /terms)
 *  - src/components/TermsOfService.tsx    (modal de registro)
 *
 * Estos dos archivos son visualmente y estructuralmente distintos (la
 * página es un resumen editorial más corto, el modal contiene el texto
 * extendido que el usuario acepta al registrarse), pero ambos deben
 * coincidir en los hechos legales clave: edad 18+, retracto 10 días
 * corridos, Ley 19.496 citada, y referencia a la Política de Cookies
 * separada.
 *
 * La sincronización byte-a-byte total queda fuera de scope y se
 * implementará cuando exista el pipeline de renderizado desde
 * docs/legal/v3.1/terms.md.
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../');
const PAGE_TOS = path.join(ROOT, 'src/pages/TermsOfService.tsx');
const MODAL_TOS = path.join(ROOT, 'src/components/TermsOfService.tsx');

function read(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

describe('Sincronización T&C página ↔ modal — invariantes legales', () => {
  it('ambos archivos existen', () => {
    expect(fs.existsSync(PAGE_TOS)).toBe(true);
    expect(fs.existsSync(MODAL_TOS)).toBe(true);
  });

  it('ambos citan la Ley 19.496', () => {
    expect(read(PAGE_TOS)).toContain('19.496');
    expect(read(MODAL_TOS)).toContain('19.496');
  });

  it('ambos mencionan el derecho de retracto en 10 días corridos', () => {
    const page = read(PAGE_TOS);
    const modal = read(MODAL_TOS);
    expect(page).toMatch(/10\s*días\s*corridos/i);
    expect(modal).toMatch(/10\s*días\s*corridos/i);
  });

  it('ningún archivo menciona "10 días hábiles" en contexto de retracto', () => {
    const page = read(PAGE_TOS);
    const modal = read(MODAL_TOS);
    // El patrón estricto del retracto incorrecto.
    const mismatch = /retracto[^\n]{0,120}10\s*días\s*hábiles/i;
    expect(page).not.toMatch(mismatch);
    expect(modal).not.toMatch(mismatch);
  });

  it('modal T&C enlaza a la Política de Cookies separada en /cookies (decisión batch 3A)', () => {
    const modal = read(MODAL_TOS);
    // El §22 debe apuntar a /cookies en lugar de repetir la política.
    expect(modal).toContain('/cookies');
    expect(modal).toMatch(/Política de Cookies/i);
  });

  it('ningún archivo menciona "16 años" como edad mínima', () => {
    expect(read(PAGE_TOS)).not.toMatch(/16\s*años/i);
    expect(read(MODAL_TOS)).not.toMatch(/16\s*años/i);
  });

  it('ambos declaran la restricción 18+ explícitamente', () => {
    const page = read(PAGE_TOS);
    const modal = read(MODAL_TOS);
    // Basta con que aparezca "18 años" ligado a "mayor/exclusiv" para
    // confirmar la cláusula operacional.
    const ageClause =
      /(mayor(es)?\s+de\s+(?:dieciocho\s+\(18\)|18)\s*años|dieciocho\s+\(18\)\s*años|18\s*años\s+de\s+edad|exclusiv[ao]\s+para\s+(?:personas\s+)?mayores\s+de\s+(?:dieciocho|18))/i;
    expect(page).toMatch(ageClause);
    expect(modal).toMatch(ageClause);
  });
});
