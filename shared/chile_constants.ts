/**
 * Constantes legales chilenas — espejo TypeScript del backend.
 *
 * Este archivo es un ESPEJO de:
 *   - backend/constants/labor_chile.py
 *   - backend/constants/tax_chile.py
 *
 * Si cambias un valor aquí, cambia también el .py correspondiente y
 * ejecuta `scripts/verify-chile-constants-sync.sh` para confirmar
 * sincronización.
 *
 * Patrón análogo a shared/legal_texts.ts.
 */

// ─── UF vigente abril 2026 ────────────────────────────────────────────────────
// Art. no aplica (indicador económico oficial del SII)
// Fuente: https://www.sii.cl/valores_y_fechas/uf/uf2026.htm
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const UF_ABRIL_2026 = 39841.72;

// ─── UTM vigente abril 2026 ───────────────────────────────────────────────────
// Art. no aplica (indicador económico oficial del SII)
// Fuente: https://www.sii.cl/valores_y_fechas/utm/utm2026.htm
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const UTM_ABRIL_2026 = 69889;

// ─── Sueldo Mínimo 2026 ───────────────────────────────────────────────────────
// Ley 21.751 — SMI $539.000 desde 2026-01-01
// Fuente: https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual/
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const SUELDO_MINIMO_2026 = 539000;

// ─── AFP — cotización obligatoria trabajador ──────────────────────────────────
// DL 3500 Art. 17 — 10% del ingreso imponible
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=7147
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const AFP_OBLIGATORIA_PCT = 0.1;

// ─── AFP UNO — comisión sobre remuneración ────────────────────────────────────
// AFP UNO licitación vigente (D-E=AFP UNO 0.46%, aprobado por Cristian §21)
// Fuente: https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9917.html
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const AFP_UNO_COMMISSION_PCT = 0.0046;

// ─── AFC — cotización trabajador contrato indefinido ─────────────────────────
// Ley 19.728 Art. 5 — 0.6% trabajador contrato indefinido
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=185700
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const AFC_TRABAJADOR_INDEFINIDO_PCT = 0.006;

// ─── AFC — cotización empleador contrato indefinido ──────────────────────────
// Ley 19.728 Art. 5 — 2.4% empleador contrato indefinido
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=185700
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const AFC_EMPLEADOR_INDEFINIDO_PCT = 0.024;

// ─── AFC — cotización empleador contrato plazo fijo ──────────────────────────
// Ley 19.728 Art. 5 — 3.0% empleador contrato plazo fijo
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=185700
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const AFC_EMPLEADOR_PLAZO_FIJO_PCT = 0.03;

// ─── SIS — Seguro de Invalidez y Sobrevivencia ────────────────────────────────
// Resolución Superintendencia de Pensiones vigencia enero 2026: 1.54%
// Fuente: https://www.spensiones.cl
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const SIS_PCT = 0.0154;

// ─── Tope imponible AFP (en UF) ───────────────────────────────────────────────
// DL 3500 Art. 16 — tope 81.6 UF mensuales
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=7147
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const TOPE_IMPONIBLE_AFP_UF = 81.6;

// ─── Tope imponible AFC (en UF) ───────────────────────────────────────────────
// Ley 19.728 — tope 135.2 UF (D-B=135.2 UF verificado por Cristian §21)
// Fuente: https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9911.html
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const TOPE_IMPONIBLE_AFC_UF = 135.2;

// ─── Jornada laboral semanal — escalones Ley 21.561 ──────────────────────────
// Ley 21.561 Art. 1° — escalón 1: 44h (vigente hasta 2026-04-25 inclusive)
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1194020
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const WEEKLY_HOURS_PRE_42H = 44;

// Ley 21.561 Art. 1° — escalón 2: 42h desde 2026-04-26
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1194020
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const WEEKLY_HOURS_POST_42H = 42;

// ─── Fecha de corte escalón 2 (44h → 42h) ────────────────────────────────────
// Ley 21.561 Art. 1° escalón 2 — vigencia 2026-04-26
// Fuente: https://www.mintrab.gob.cl/ley-40-horas-conoce-las-principales-medidas-que-comienzan-a-regir-el-26-de-abril/
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21, D-F=fecha corte día exacto 2026-04-26)
export const FECHA_ESCALON_42H = new Date('2026-04-26T00:00:00Z');

// ─── Retención de honorarios 2026 ────────────────────────────────────────────
// Ley 21.133 Art. Transitorio — progresión hasta 17% en 2028; vigente 2026: 15.25%
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=1128094
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21, D-C=15.25%)
export const RETENCION_HONORARIOS_2026_PCT = 0.1525;

// ─── IVA ──────────────────────────────────────────────────────────────────────
// DL 825 Art. 14 — tasa general IVA 19%
// Fuente: https://www.bcn.cl/leychile/navegar?idNorma=6369
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const IVA_PCT = 0.19;

// ─── PPM ProPyme Art. 14D3 ────────────────────────────────────────────────────
// Régimen Pro PyME Art. 14D3 — PPM 0.25% sobre ingresos netos
// Fuente: https://www.sii.cl/destacados/propyme/pyme_ley_modernizacion.html
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
export const PPM_PROPYME_14D3_PCT = 0.0025;

// ─── Tabla impuesto 2ª categoría 2026 (en UTM) ───────────────────────────────
// DL 824 Art. 42 bis y 43 — tramos vigentes 2026 según circular SII
// Fuente: https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
// Verificado: 2026-04-21
// Verificador: Cristian (Capa 0 batch §21)
//
// Formato: [desde_UTM, hasta_UTM | null, tasa, deduccion_UTM]
// null en hasta_UTM indica tramo sin límite superior
export const IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM: Array<[number, number | null, number, number]> =
  [
    [0, 13.5, 0, 0],
    [13.5, 30, 0.04, 0.54],
    [30, 50, 0.08, 1.74],
    [50, 70, 0.135, 4.49],
    [70, 90, 0.23, 11.14],
    [90, 120, 0.304, 17.8],
    [120, 310, 0.35, 23.32],
    [310, null, 0.4, 38.82],
  ];

// ─── Funciones de jornada ─────────────────────────────────────────────────────

/**
 * Devuelve las horas semanales legales vigentes en la fecha dada.
 *
 * Ley 21.561 escalón 2: desde 2026-04-26 la jornada máxima ordinaria
 * es 42 horas semanales. Antes de esa fecha rige el escalón 1: 44 horas.
 *
 * @param fecha - Fecha para la cual determinar la jornada vigente
 * @returns 42 si fecha >= 2026-04-26 UTC, 44 en caso contrario
 */
export function getWeeklyHoursAtDate(fecha: Date): number {
  return fecha >= FECHA_ESCALON_42H ? WEEKLY_HOURS_POST_42H : WEEKLY_HOURS_PRE_42H;
}

/**
 * Devuelve las horas mensuales legales vigentes en la fecha dada.
 * Calcula como horas semanales × 4 semanas.
 *
 * @param fecha - Fecha para la cual determinar la jornada vigente
 * @returns 168 si fecha >= 2026-04-26 UTC, 176 en caso contrario
 */
export function getMonthlyHoursAtDate(fecha: Date): number {
  return getWeeklyHoursAtDate(fecha) * 4;
}
