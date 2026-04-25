/**
 * Tests de invariantes para shared/chile_constants.ts
 *
 * Valida:
 * - Valores numéricos exactos de constantes legales chilenas (espejo del .py backend)
 * - Función getWeeklyHoursAtDate con fechas de corte Ley 21.561
 * - Función getMonthlyHoursAtDate
 *
 * Fuentes verificadas:
 * - Ley 21.561 Art. 1° escalón 2: 42h desde 2026-04-26 (bcn.cl/leychile/navegar?idNorma=1194020)
 * - SII UF/UTM abril 2026: sii.cl/valores_y_fechas/uf/uf2026.htm
 * - DL 3500 Art. 17: AFP 10% (bcn.cl/leychile/navegar?idNorma=7147)
 * - Ley 19.728: AFC porcentajes (bcn.cl/leychile/navegar?idNorma=185700)
 * - spensiones.cl: SIS 1.54% (spensiones.cl enero 2026)
 */

import { describe, expect, it } from 'vitest';

import {
  AFP_OBLIGATORIA_PCT,
  AFP_UNO_COMMISSION_PCT,
  AFC_EMPLEADOR_INDEFINIDO_PCT,
  AFC_EMPLEADOR_PLAZO_FIJO_PCT,
  AFC_TRABAJADOR_INDEFINIDO_PCT,
  FECHA_ESCALON_42H,
  IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM,
  IVA_PCT,
  PPM_PROPYME_14D3_PCT,
  RETENCION_HONORARIOS_2026_PCT,
  SIS_PCT,
  SUELDO_MINIMO_2026,
  TOPE_IMPONIBLE_AFC_UF,
  TOPE_IMPONIBLE_AFP_UF,
  UF_ABRIL_2026,
  UTM_ABRIL_2026,
  WEEKLY_HOURS_POST_42H,
  WEEKLY_HOURS_PRE_42H,
  getMonthlyHoursAtDate,
  getWeeklyHoursAtDate,
} from 'shared/chile_constants';

describe('chile_constants — valores numéricos exactos', () => {
  it('UF_ABRIL_2026 es 39841.72 (sii.cl abril 2026)', () => {
    expect(UF_ABRIL_2026).toBe(39841.72);
  });

  it('UTM_ABRIL_2026 es 69889 (sii.cl abril 2026)', () => {
    expect(UTM_ABRIL_2026).toBe(69889);
  });

  it('SUELDO_MINIMO_2026 es 539000 (Ley 21.751)', () => {
    expect(SUELDO_MINIMO_2026).toBe(539000);
  });

  it('AFP_OBLIGATORIA_PCT es 0.10 (DL 3500 Art. 17)', () => {
    expect(AFP_OBLIGATORIA_PCT).toBe(0.1);
  });

  it('AFP_UNO_COMMISSION_PCT es 0.0046 (AFP Uno licitación vigente)', () => {
    expect(AFP_UNO_COMMISSION_PCT).toBe(0.0046);
  });

  it('AFC_TRABAJADOR_INDEFINIDO_PCT es 0.006 (Ley 19.728)', () => {
    expect(AFC_TRABAJADOR_INDEFINIDO_PCT).toBe(0.006);
  });

  it('AFC_EMPLEADOR_INDEFINIDO_PCT es 0.024 (Ley 19.728)', () => {
    expect(AFC_EMPLEADOR_INDEFINIDO_PCT).toBe(0.024);
  });

  it('AFC_EMPLEADOR_PLAZO_FIJO_PCT es 0.03 (Ley 19.728)', () => {
    expect(AFC_EMPLEADOR_PLAZO_FIJO_PCT).toBe(0.03);
  });

  it('SIS_PCT es 0.0154 (spensiones.cl enero 2026)', () => {
    expect(SIS_PCT).toBe(0.0154);
  });

  it('TOPE_IMPONIBLE_AFP_UF es 81.6', () => {
    expect(TOPE_IMPONIBLE_AFP_UF).toBe(81.6);
  });

  it('TOPE_IMPONIBLE_AFC_UF es 135.2 (Cristian D-B=135.2 verificado)', () => {
    expect(TOPE_IMPONIBLE_AFC_UF).toBe(135.2);
  });

  it('WEEKLY_HOURS_PRE_42H es 44', () => {
    expect(WEEKLY_HOURS_PRE_42H).toBe(44);
  });

  it('WEEKLY_HOURS_POST_42H es 42', () => {
    expect(WEEKLY_HOURS_POST_42H).toBe(42);
  });

  it('FECHA_ESCALON_42H es 2026-04-26 UTC', () => {
    expect(FECHA_ESCALON_42H.getUTCFullYear()).toBe(2026);
    expect(FECHA_ESCALON_42H.getUTCMonth()).toBe(3); // abril = 3 (0-indexed)
    expect(FECHA_ESCALON_42H.getUTCDate()).toBe(26);
  });

  it('RETENCION_HONORARIOS_2026_PCT es 0.1525 (Ley 21.133 transitorio, D-C=15.25%)', () => {
    expect(RETENCION_HONORARIOS_2026_PCT).toBe(0.1525);
  });

  it('IVA_PCT es 0.19 (DL 825)', () => {
    expect(IVA_PCT).toBe(0.19);
  });

  it('PPM_PROPYME_14D3_PCT es 0.0025', () => {
    expect(PPM_PROPYME_14D3_PCT).toBe(0.0025);
  });
});

describe('chile_constants — tabla impuesto 2ª categoría 2026', () => {
  it('tiene exactamente 8 tramos', () => {
    expect(IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM).toHaveLength(8);
  });

  it('el último tramo inicia en 310 UTM (no 150)', () => {
    const lastBracket = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[7];
    expect(lastBracket[0]).toBe(310);
    expect(lastBracket[1]).toBeNull(); // sin tope
  });

  it('el séptimo tramo es [120, 310, 0.35, 23.32]', () => {
    const bracket = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[6];
    expect(bracket[0]).toBe(120);
    expect(bracket[1]).toBe(310);
    expect(bracket[2]).toBe(0.35);
    expect(bracket[3]).toBe(23.32);
  });

  it('el primer tramo tiene rate 0 y deducción 0', () => {
    const first = IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[0];
    expect(first[2]).toBe(0);
    expect(first[3]).toBe(0);
  });

  it('los tramos están ordenados ascendentemente por límite inferior', () => {
    for (let i = 1; i < IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM.length; i++) {
      expect(IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[i][0]).toBeGreaterThan(
        IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM[i - 1][0]
      );
    }
  });
});

describe('getWeeklyHoursAtDate — Ley 21.561 escalón 2', () => {
  it('devuelve 44 para fecha antes de 2026-04-26 (ej: 2026-04-25)', () => {
    expect(getWeeklyHoursAtDate(new Date('2026-04-25T00:00:00Z'))).toBe(44);
  });

  it('devuelve 42 exactamente en 2026-04-26', () => {
    expect(getWeeklyHoursAtDate(new Date('2026-04-26T00:00:00Z'))).toBe(42);
  });

  it('devuelve 42 para fechas después de 2026-04-26 (ej: 2026-05-01)', () => {
    expect(getWeeklyHoursAtDate(new Date('2026-05-01T00:00:00Z'))).toBe(42);
  });

  it('devuelve 42 para fecha al inicio del 2027', () => {
    expect(getWeeklyHoursAtDate(new Date('2027-01-01T00:00:00Z'))).toBe(42);
  });

  it('devuelve 44 para fecha un segundo antes de 2026-04-26', () => {
    expect(getWeeklyHoursAtDate(new Date('2026-04-25T23:59:59Z'))).toBe(44);
  });

  it('devuelve 44 para fecha previa 2025-12-31', () => {
    expect(getWeeklyHoursAtDate(new Date('2025-12-31T00:00:00Z'))).toBe(44);
  });
});

describe('getMonthlyHoursAtDate — derivada de weekly × 4', () => {
  it('devuelve 176 (44 × 4) antes del 2026-04-26', () => {
    expect(getMonthlyHoursAtDate(new Date('2026-04-25T00:00:00Z'))).toBe(176);
  });

  it('devuelve 168 (42 × 4) desde el 2026-04-26', () => {
    expect(getMonthlyHoursAtDate(new Date('2026-04-26T00:00:00Z'))).toBe(168);
  });

  it('devuelve 168 para fecha futura 2026-12-01', () => {
    expect(getMonthlyHoursAtDate(new Date('2026-12-01T00:00:00Z'))).toBe(168);
  });
});
