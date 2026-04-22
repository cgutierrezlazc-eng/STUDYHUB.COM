/**
 * sandboxGate.ts — Módulo de acceso al password del sandbox.
 *
 * El password se lee desde la env var VITE_SANDBOX_GATE_PASSWORD,
 * definida en Vercel para producción y en .env.local para desarrollo.
 *
 * Uso en HTML estático (public/sandbox/):
 *   - El plugin de Vite en vite.config.ts inyecta el valor durante el build
 *     como window.SANDBOX_GATE_PASSWORD en un <script> en cada HTML del sandbox.
 *   - _gate.js lee window.SANDBOX_GATE_PASSWORD en tiempo de ejecución.
 *
 * Uso en código React (si se necesitara):
 *   import { getSandboxGatePassword } from './sandboxGate';
 */

/**
 * Retorna el password del sandbox desde la env var de build.
 * En desarrollo: requiere VITE_SANDBOX_GATE_PASSWORD en .env.local
 * En producción: configurado en panel Vercel como VITE_SANDBOX_GATE_PASSWORD
 */
export function getSandboxGatePassword(): string {
  return import.meta.env.VITE_SANDBOX_GATE_PASSWORD ?? '';
}
