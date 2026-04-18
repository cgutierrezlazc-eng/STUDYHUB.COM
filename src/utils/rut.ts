/** Valida RUT chileno con algoritmo módulo 11 */
export function validateRut(rut: string): boolean {
  const clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  let total = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    total += parseInt(body[i]) * factor;
    factor = factor < 7 ? factor + 1 : 2;
  }
  const remainder = 11 - (total % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expected;
}

/** Formatea RUT: 12345678-9 → 12.345.678-9 */
export function formatRut(rut: string): string {
  const clean = rut.replace(/\./g, '').replace(/-/g, '');
  if (clean.length < 2) return rut;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}
