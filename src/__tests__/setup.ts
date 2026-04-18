/**
 * Setup global para tests Vitest.
 *
 * - Carga los matchers de @testing-library/jest-dom (toBeInTheDocument, etc.)
 * - Limpia automáticamente el DOM entre tests (via @testing-library/react ≥13).
 * - Mock mínimo para `crypto.subtle` si el ambiente jsdom no lo expone.
 */

import '@testing-library/jest-dom/vitest';

// jsdom tiene crypto.subtle en Node 20+. Si algún día migramos a un entorno
// sin él, este polyfill evita que los tests fallen al computar SHA-256.
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  // @ts-expect-error: shim de emergencia para entornos sin Web Crypto
  globalThis.crypto = (await import('node:crypto')).webcrypto;
}
