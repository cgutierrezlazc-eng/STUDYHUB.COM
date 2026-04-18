/**
 * Tests del espejo TypeScript de los textos legales.
 *
 * Valida:
 * - El hash hardcoded en shared/legal_texts.ts coincide con el que compute
 *   `computeHash(AGE_DECLARATION_TEXT_V1)` usando Web Crypto.
 * - El texto incluye los 5 puntos obligatorios de CLAUDE.md §Componente 2.
 * - La versión sigue semver.
 * - El texto no menciona "representante legal" ni variantes de autorización
 *   parental.
 *
 * La sincronía con shared/legal_texts.py se valida por separado con
 * scripts/verify-legal-texts-sync.sh en CI.
 */

import { describe, expect, it } from 'vitest';

import {
  AGE_DECLARATION_HASH,
  AGE_DECLARATION_TEXT_V1,
  AGE_DECLARATION_VERSION,
  computeHash,
} from 'shared/legal_texts';

describe('legal_texts (espejo TypeScript)', () => {
  it('el hash hardcoded coincide con computeHash del texto', async () => {
    const recomputed = await computeHash(AGE_DECLARATION_TEXT_V1);
    expect(recomputed).toBe(AGE_DECLARATION_HASH);
  });

  it('el hash es 64 chars hex lowercase', () => {
    expect(AGE_DECLARATION_HASH).toMatch(/^[0-9a-f]{64}$/);
  });

  it('la versión es semver válido', () => {
    expect(AGE_DECLARATION_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('el texto empieza con la frase canónica', () => {
    expect(
      AGE_DECLARATION_TEXT_V1.startsWith(
        'Al marcar esta casilla, declaro bajo fe de juramento que:'
      )
    ).toBe(true);
  });

  it('el texto incluye los 5 puntos obligatorios', () => {
    expect(AGE_DECLARATION_TEXT_V1).toContain('1. Soy mayor de 18 años');
    expect(AGE_DECLARATION_TEXT_V1).toContain('2. Los datos proporcionados');
    expect(AGE_DECLARATION_TEXT_V1).toContain('3. Entiendo que declarar información falsa');
    expect(AGE_DECLARATION_TEXT_V1).toContain('4. Eximo a Conniku SpA');
    expect(AGE_DECLARATION_TEXT_V1).toContain('5. Acepto los Términos y Condiciones');
  });

  it('el texto no menciona representante legal ni autorización parental', () => {
    const lowered = AGE_DECLARATION_TEXT_V1.toLowerCase();
    expect(lowered).not.toContain('representante legal');
    expect(lowered).not.toContain('autorización parental');
    expect(lowered).not.toContain('autorización del tutor');
    expect(lowered).not.toContain('consentimiento parental');
  });

  it('computeHash es determinista para el mismo input', async () => {
    const a = await computeHash('conniku');
    const b = await computeHash('conniku');
    expect(a).toBe(b);
  });

  it('computeHash cambia con cualquier modificación al texto', async () => {
    const original = await computeHash(AGE_DECLARATION_TEXT_V1);
    const modified = await computeHash(AGE_DECLARATION_TEXT_V1 + ' ');
    expect(original).not.toBe(modified);
  });
});
