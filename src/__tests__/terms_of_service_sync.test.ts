/**
 * terms_of_service_sync.test.ts
 *
 * Pieza 1 del bloque bloque-legal-consolidation-v2.
 * Actualizado en bloque legal-viewer-v1 (D-L7=A): la fuente de verdad
 * es ahora docs/02-legal/vigentes/terms.md (markdown canónico), no el TSX.
 * El TSX es un wrapper del renderer.
 *
 * Valida invariantes que deben cumplirse simultáneamente en:
 *  - docs/02-legal/vigentes/terms.md            (fuente canónica, renderizada en /terms y /legal/terms)
 *  - src/components/TermsOfService.tsx   (modal de registro)
 *
 * La sincronización se garantiza por render runtime (react-markdown).
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../');
// D-L7=A: el contenido legal canónico vive ahora en el markdown
const MARKDOWN_TOS = path.join(ROOT, 'docs/02-legal/vigentes/terms.md');
const MODAL_TOS = path.join(ROOT, 'src/components/TermsOfService.tsx');

function read(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

describe('Sincronización T&C página ↔ modal — invariantes legales', () => {
  it('ambos archivos existen', () => {
    expect(fs.existsSync(MARKDOWN_TOS)).toBe(true);
    expect(fs.existsSync(MODAL_TOS)).toBe(true);
  });

  it('ambos citan la Ley 19.496', () => {
    expect(read(MARKDOWN_TOS)).toContain('19.496');
    expect(read(MODAL_TOS)).toContain('19.496');
  });

  it('ambos mencionan el derecho de retracto en 10 días corridos', () => {
    const markdown = read(MARKDOWN_TOS);
    const modal = read(MODAL_TOS);
    expect(markdown).toMatch(/10\s*días\s*corridos/i);
    expect(modal).toMatch(/10\s*días\s*corridos/i);
  });

  it('ningún archivo menciona "10 días hábiles" en contexto de retracto', () => {
    const markdown = read(MARKDOWN_TOS);
    const modal = read(MODAL_TOS);
    // El patrón estricto del retracto incorrecto.
    const mismatch = /retracto[^\n]{0,120}10\s*días\s*hábiles/i;
    expect(markdown).not.toMatch(mismatch);
    expect(modal).not.toMatch(mismatch);
  });

  it('modal T&C enlaza a la Política de Cookies separada en /cookies (decisión batch 3A)', () => {
    const modal = read(MODAL_TOS);
    // El §22 debe apuntar a /cookies en lugar de repetir la política.
    expect(modal).toContain('/cookies');
    expect(modal).toMatch(/Política de Cookies/i);
  });

  it('ningún archivo menciona "16 años" como edad mínima', () => {
    expect(read(MARKDOWN_TOS)).not.toMatch(/16\s*años/i);
    expect(read(MODAL_TOS)).not.toMatch(/16\s*años/i);
  });

  it('ambos declaran la restricción 18+ explícitamente', () => {
    const markdown = read(MARKDOWN_TOS);
    const modal = read(MODAL_TOS);
    // Basta con que aparezca "18 años" ligado a "mayor/exclusiv" para
    // confirmar la cláusula operacional.
    const ageClause =
      /(mayor(es)?\s+de\s+(?:dieciocho\s+\(18\)|18)\s*años|dieciocho\s+\(18\)\s*años|18\s*años\s+de\s+edad|exclusiv[ao]\s+para\s+(?:personas\s+)?mayores\s+de\s+(?:dieciocho|18))/i;
    expect(markdown).toMatch(ageClause);
    expect(modal).toMatch(ageClause);
  });
});
