// ─── Chilean Labor Law Constants (Auto-updatable) ──────────────
// Fuente: Ministerio del Trabajo, SII, Superintendencia de Pensiones
// IMPORTANTE: Los valores numéricos se importan desde shared/chile_constants.ts
// (espejo del backend). No hardcodear aquí — editar la fuente y re-sincronizar.

import {
  AFC_EMPLEADOR_INDEFINIDO_PCT,
  AFC_EMPLEADOR_PLAZO_FIJO_PCT,
  AFC_TRABAJADOR_INDEFINIDO_PCT,
  IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM,
  SIS_PCT,
  SUELDO_MINIMO_2026,
  TOPE_IMPONIBLE_AFC_UF,
  TOPE_IMPONIBLE_AFP_UF,
  UF_ABRIL_2026,
  UTM_ABRIL_2026,
} from 'shared/chile_constants';

export const CHILE_LABOR = {
  // ─── Ingreso Minimo Mensual (IMM) — Art. 44 Codigo del Trabajo ───
  // Ley 21.751 — SMI $539.000 desde 2026-01-01
  IMM: {
    current: SUELDO_MINIMO_2026,
    effectiveDate: '2026-01-01',
    history: [
      { from: '2026-01-01', amount: 539000 },
      { from: '2024-07-01', amount: 500000 },
      { from: '2024-01-01', amount: 460000 },
      { from: '2023-09-01', amount: 440000 },
      { from: '2023-05-01', amount: 410000 },
      { from: '2022-08-01', amount: 400000 },
    ],
    partialRate: (weeklyHours: number) => Math.round((SUELDO_MINIMO_2026 * weeklyHours) / 40),
    reduced: 372989,
    nonRemunerational: 296514,
  },

  UF: { value: UF_ABRIL_2026, lastUpdate: '2026-04-01' },
  UTM: { value: UTM_ABRIL_2026, lastUpdate: '2026-04-01' },

  TOPES: {
    afpUF: TOPE_IMPONIBLE_AFP_UF,
    afcUF: TOPE_IMPONIBLE_AFC_UF,
    saludUF: TOPE_IMPONIBLE_AFP_UF,
    get afpCLP() {
      return Math.round(CHILE_LABOR.UF.value * this.afpUF);
    },
    get afcCLP() {
      return Math.round(CHILE_LABOR.UF.value * this.afcUF);
    },
    get saludCLP() {
      return Math.round(CHILE_LABOR.UF.value * this.saludUF);
    },
  },

  GRATIFICACION: {
    rate: 0.25,
    topeMensualIMM: 4.75,
    get topeMensual() {
      return Math.round((CHILE_LABOR.IMM.current * this.topeMensualIMM) / 12);
    },
  },

  AFC: {
    employeeRate: AFC_TRABAJADOR_INDEFINIDO_PCT,
    employerIndefinido: AFC_EMPLEADOR_INDEFINIDO_PCT,
    employerPlazoFijo: AFC_EMPLEADOR_PLAZO_FIJO_PCT,
  },

  SIS: { rate: SIS_PCT },

  MUTUAL: { baseRate: 0.0093, additionalRate: 0 },

  HORAS_EXTRA: { recargo: 0.5, maxDiarias: 2, maxPacto: 3 },

  // DL 824 Art. 43 — tramos impuesto 2ª categoría vigentes 2026 (circular SII)
  // Fuente: https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
  TAX_BRACKETS: IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM.map(([from, to, rate, deduction]) => ({
    from,
    to: to === null ? Infinity : to,
    rate,
    deduction,
  })),

  APV: {
    regimes: [
      {
        value: 'A',
        label: 'Regimen A — Bonificacion fiscal 15% (tope 6 UTM/ano)',
        maxAnnualUTM: 6,
      },
      { value: 'B', label: 'Regimen B — Rebaja base tributable (sin tope legal, tope 600 UF/ano)' },
    ],
    maxAnnualUF: 600,
  },

  PENSION_ALIMENTOS: {
    minimoPerHijo: 0.4,
    minimoMultiple: 0.3,
    maxRetencion: 0.5,
  },

  VOLUNTARY_DEDUCTIONS: { maxRate: 0.15 },

  CONNIKU_PAYROLL: {
    cierreDia: 22,
    pagoDia: 'ultimo_habil' as const,
    anticipoDia: 15,
    anticipoMaxPct: 0.4,
    previredPlazo: 13,
  },

  CONTRACT_PROGRESSION: {
    stages: [
      { stage: 1, type: 'plazo_fijo', days: 30, label: '1er Contrato — Plazo Fijo 30 dias' },
      { stage: 2, type: 'plazo_fijo', days: 60, label: '2do Contrato — Plazo Fijo 60 dias' },
      { stage: 3, type: 'indefinido', days: 0, label: '3er Contrato — Indefinido' },
    ],
    allowDirectIndefinido: true,
  },

  INDEMNIZACIONES: {
    anosServicioTope: 11,
    remuneracionTopeUF: 90,
    sustitutiva: 30,
    faltaAviso: 30,
    recargos: {
      art161: 0.3,
      art159_4_6: 0.5,
      art160: 0.8,
    },
  },

  FERIADO: {
    diasBase: 15,
    progresivo: { fromYear: 10, extraPerYears: 3, extraDays: 1 },
    acumulacionMax: 2,
  },
};

export function validateSalary(
  gross: number,
  weeklyHours: number = 40
): { valid: boolean; min: number; message: string } {
  const min = weeklyHours < 40 ? CHILE_LABOR.IMM.partialRate(weeklyHours) : CHILE_LABOR.IMM.current;
  return {
    valid: gross >= min,
    min,
    message:
      gross < min
        ? `Sueldo $${gross.toLocaleString('es-CL')} es inferior al minimo legal $${min.toLocaleString('es-CL')} para ${weeklyHours}h/sem (Art. 44 CT)`
        : '',
  };
}

export function calculateTax(taxableIncome: number): number {
  const utm = CHILE_LABOR.UTM.value;
  const incomeUTM = taxableIncome / utm;
  for (const bracket of CHILE_LABOR.TAX_BRACKETS) {
    if (incomeUTM > bracket.from && incomeUTM <= bracket.to) {
      return Math.round((incomeUTM * bracket.rate - bracket.deduction) * utm);
    }
  }
  return 0;
}
