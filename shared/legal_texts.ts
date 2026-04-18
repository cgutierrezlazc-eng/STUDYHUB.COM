/**
 * Textos legales canónicos del proyecto Conniku (espejo frontend).
 *
 * Este archivo es un ESPEJO de `shared/legal_texts.py` (la fuente de verdad
 * del backend). Ambos archivos deben mantener el mismo texto literal y
 * por tanto el mismo hash SHA-256.
 *
 * El script `scripts/verify-legal-texts-sync.sh` valida la sincronización en
 * cada CI. Si los hashes divergen, el CI falla y el merge se bloquea.
 *
 * IMPORTANTE:
 * - Al editar el texto, también debes editar el .py con el mismo cambio
 *   y bumpear AGE_DECLARATION_VERSION en ambos archivos.
 * - No mezcles concatenación con template strings: los newlines deben ser
 *   exactamente "\n" (Unix), sin CRLF ni espacios trailing.
 */

// Texto canónico del checkbox declarativo de edad (Componente 2 de
// CLAUDE.md §Verificación de edad). Versión oficial, sin parafrasear.
export const AGE_DECLARATION_TEXT_V1 =
  "Al marcar esta casilla, declaro bajo fe de juramento que:\n" +
  "\n" +
  "1. Soy mayor de 18 años a la fecha de este registro.\n" +
  "2. Los datos proporcionados, incluyendo mi fecha de nacimiento, son verdaderos y pueden ser verificados por Conniku en cualquier momento.\n" +
  "3. Entiendo que declarar información falsa constituye causal inmediata de terminación de mi cuenta, pérdida total de membresía, eliminación de todos mis datos, y podrá acarrear responsabilidad civil y penal según la legislación vigente.\n" +
  "4. Eximo a Conniku SpA de toda responsabilidad derivada de información falsa que yo haya proporcionado.\n" +
  "5. Acepto los Términos y Condiciones del servicio y la Política de Privacidad, que he leído y comprendido.";

export const AGE_DECLARATION_VERSION = "1.0.0";

/**
 * Hash SHA-256 del texto canónico (hex lowercase).
 *
 * Este valor está HARDCODED y debe coincidir exactamente con el calculado
 * por shared/legal_texts.py::AGE_DECLARATION_HASH.
 *
 * El script scripts/verify-legal-texts-sync.sh recalcula ambos hashes y
 * bloquea el merge si divergen.
 */
export const AGE_DECLARATION_HASH =
  "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706";

/**
 * Calcula el hash SHA-256 del texto usando Web Crypto API (disponible en
 * navegadores modernos y Node 20+).
 *
 * Útil para validar en runtime que el cliente recibió el texto íntegro
 * antes de enviarlo al backend. Si el hash calculado en el cliente no
 * coincide con AGE_DECLARATION_HASH, hay tampering o el bundle está stale.
 */
export async function computeHash(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
