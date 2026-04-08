// ─── Chilean Labor Law Constants (Auto-updatable) ──────────────
// Fuente: Ministerio del Trabajo, SII, Superintendencia de Pensiones
// IMPORTANTE: Actualizar estos valores cada vez que cambien por ley

export const CHILE_LABOR = {
  // ─── Ingreso Minimo Mensual (IMM) — Art. 44 Codigo del Trabajo ───
  IMM: {
    current: 500000,
    effectiveDate: '2024-07-01',
    history: [
      { from: '2024-07-01', amount: 500000 },
      { from: '2024-01-01', amount: 460000 },
      { from: '2023-09-01', amount: 440000 },
      { from: '2023-05-01', amount: 410000 },
      { from: '2022-08-01', amount: 400000 },
    ],
    partialRate: (weeklyHours: number) => Math.round(500000 * weeklyHours / 40),
    reduced: 372989,
    nonRemunerational: 296514,
  },

  UF: { value: 38700, lastUpdate: '2026-04-01' },
  UTM: { value: 67294, lastUpdate: '2026-04-01' },

  TOPES: {
    afpUF: 81.6,
    afcUF: 122.6,
    saludUF: 81.6,
    get afpCLP() { return Math.round(CHILE_LABOR.UF.value * this.afpUF) },
    get afcCLP() { return Math.round(CHILE_LABOR.UF.value * this.afcUF) },
    get saludCLP() { return Math.round(CHILE_LABOR.UF.value * this.saludUF) },
  },

  GRATIFICACION: {
    rate: 0.25,
    topeMensualIMM: 4.75,
    get topeMensual() { return Math.round(CHILE_LABOR.IMM.current * this.topeMensualIMM / 12) },
  },

  AFC: {
    employeeRate: 0.006,
    employerIndefinido: 0.024,
    employerPlazoFijo: 0.03,
  },

  SIS: { rate: 0.0141 },

  MUTUAL: { baseRate: 0.0093, additionalRate: 0 },

  HORAS_EXTRA: { recargo: 0.5, maxDiarias: 2, maxPacto: 3 },

  TAX_BRACKETS: [
    { from: 0,      to: 13.5,   rate: 0,     deduction: 0 },
    { from: 13.5,   to: 30,     rate: 0.04,  deduction: 0.54 },
    { from: 30,     to: 50,     rate: 0.08,  deduction: 1.74 },
    { from: 50,     to: 70,     rate: 0.135, deduction: 4.49 },
    { from: 70,     to: 90,     rate: 0.23,  deduction: 11.14 },
    { from: 90,     to: 120,    rate: 0.304, deduction: 17.80 },
    { from: 120,    to: 150,    rate: 0.35,  deduction: 23.32 },
    { from: 150,    to: Infinity, rate: 0.40, deduction: 30.82 },
  ],

  APV: {
    regimes: [
      { value: 'A', label: 'Regimen A — Bonificacion fiscal 15% (tope 6 UTM/ano)', maxAnnualUTM: 6 },
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
    anticipoMaxPct: 0.40,
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
      art161: 0.30,
      art159_4_6: 0.50,
      art160: 0.80,
    },
  },

  FERIADO: {
    diasBase: 15,
    progresivo: { fromYear: 10, extraPerYears: 3, extraDays: 1 },
    acumulacionMax: 2,
  },
}

export function validateSalary(gross: number, weeklyHours: number = 40): { valid: boolean; min: number; message: string } {
  const min = weeklyHours < 40
    ? CHILE_LABOR.IMM.partialRate(weeklyHours)
    : CHILE_LABOR.IMM.current
  return {
    valid: gross >= min,
    min,
    message: gross < min
      ? `Sueldo $${gross.toLocaleString('es-CL')} es inferior al minimo legal $${min.toLocaleString('es-CL')} para ${weeklyHours}h/sem (Art. 44 CT)`
      : '',
  }
}

export function calculateTax(taxableIncome: number): number {
  const utm = CHILE_LABOR.UTM.value
  const incomeUTM = taxableIncome / utm
  for (const bracket of CHILE_LABOR.TAX_BRACKETS) {
    if (incomeUTM > bracket.from && incomeUTM <= bracket.to) {
      return Math.round((incomeUTM * bracket.rate - bracket.deduction) * utm)
    }
  }
  return 0
}
