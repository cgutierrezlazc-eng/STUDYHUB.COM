/**
 * src/config/v3.ts — Configuración del piloto de rediseño v3
 *
 * Activa los componentes v3 (Landing, Login, Register, Dashboard paralelo).
 * Según decisión P-4 de Cristian: constante en código, NO variable de entorno.
 *
 * Para desactivar el piloto: cambiar a false y hacer deploy.
 * Para activarlo: true (valor por defecto en este bloque piloto).
 */

/** Activa Landing v3 en lugar de la versión legacy */
export const LANDING_V3_ENABLED = true;

/** Activa LoginV3 y RegisterV3 en lugar de las versiones legacy */
export const AUTH_V3_ENABLED = true;
