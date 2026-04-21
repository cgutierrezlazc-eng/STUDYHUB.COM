/**
 * Tests de invariantes para src/admin/shared/ChileLaborConstants.ts
 *
 * Valida que el wrapper importa los valores correctos desde
 * shared/chile_constants.ts y que las funciones de lógica producen
 * resultados coherentes con los valores actualizados 2026.
 *
 * Cambios verificados:
 * - IMM 500k → 539k (Ley 21.751)
 * - UF 38.700 → 39.841,72 (sii.cl abril 2026)
 * - UTM 67.294 → 69.889 (sii.cl abril 2026)
 * - SIS 1.41% → 1.54% (spensiones.cl enero 2026)
 * - Último tramo impuesto 150 UTM → 310 UTM (SII circular 2026)
 * - AFC tope 122.6 → 135.2 UF (D-B=135.2 verificado Cristian)
 */

import { describe, expect, it } from 'vitest';

import { CHILE_LABOR, calculateTax, validateSalary } from '../ChileLaborConstants';

describe('ChileLaborConstants — valores desde shared/chile_constants', () => {
  it('UF es 39841.72 (no 38700 desfasado)', () => {
    expect(CHILE_LABOR.UF.value).toBe(39841.72);
  });

  it('UTM es 69889 (no 67294 desfasado)', () => {
    expect(CHILE_LABOR.UTM.value).toBe(69889);
  });

  it('SIS rate es 0.0154 (no 0.0141 desfasado)', () => {
    expect(CHILE_LABOR.SIS.rate).toBe(0.0154);
  });

  it('TOPES.afcUF es 135.2 (no 122.6 desfasado)', () => {
    expect(CHILE_LABOR.TOPES.afcUF).toBe(135.2);
  });

  it('IMM.current es 539000 (Ley 21.751, no 500000)', () => {
    expect(CHILE_LABOR.IMM.current).toBe(539000);
  });
});

describe('validateSalary — usa IMM actualizado 539k', () => {
  it('sueldo 500000 con 44h/sem es inválido (IMM ahora es 539k)', () => {
    const result = validateSalary(500000, 44);
    expect(result.valid).toBe(false);
    expect(result.min).toBe(539000);
  });

  it('sueldo 539000 con 44h/sem es válido', () => {
    const result = validateSalary(539000, 44);
    expect(result.valid).toBe(true);
  });

  it('sueldo 600000 con 44h/sem es válido', () => {
    const result = validateSalary(600000, 44);
    expect(result.valid).toBe(true);
  });

  it('sueldo 0 es inválido', () => {
    const result = validateSalary(0, 44);
    expect(result.valid).toBe(false);
  });
});

describe('calculateTax — último tramo en 310 UTM (no 150)', () => {
  it('ingreso de 350 UTM cae en el último tramo (310+)', () => {
    const utm = 69889;
    const ingreso350utm = utm * 350;
    const tax = calculateTax(ingreso350utm);
    // Tramo: rate 40%, deducción 38.82 UTM
    const expectedTax = Math.round((350 * 0.4 - 38.82) * utm);
    expect(tax).toBe(expectedTax);
  });

  it('ingreso de 200 UTM cae en tramo [120-310] con rate 35%', () => {
    const utm = 69889;
    const ingreso200utm = utm * 200;
    const tax = calculateTax(ingreso200utm);
    const expectedTax = Math.round((200 * 0.35 - 23.32) * utm);
    expect(tax).toBe(expectedTax);
  });

  it('ingreso de 160 UTM cae en tramo [120-310], no en el tramo antiguo 150+', () => {
    const utm = 69889;
    const ingreso160utm = utm * 160;
    const tax = calculateTax(ingreso160utm);
    // Con el tramo nuevo [120-310, 0.35] — NO debe aplicar rate 0.40 (tramo viejo)
    const taxWithOldBracket = Math.round((160 * 0.4 - 30.82) * utm);
    expect(tax).not.toBe(taxWithOldBracket);
    // Debe aplicar rate 0.35
    const taxWithNewBracket = Math.round((160 * 0.35 - 23.32) * utm);
    expect(tax).toBe(taxWithNewBracket);
  });

  it('ingreso de 5 UTM (exento) devuelve 0', () => {
    const utm = 69889;
    expect(calculateTax(utm * 5)).toBe(0);
  });
});
