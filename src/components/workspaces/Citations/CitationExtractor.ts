/**
 * CitationExtractor — extrae citas APA en texto libre.
 * Sub-bloque 2d.1 APA 7 + citas + referencias.
 *
 * Función pura. Sin dependencias externas.
 */

export interface ExtractedCitation {
  id: string;
  raw: string;
}

/**
 * Regex base: captura contenido entre paréntesis que contenga un año
 * (4 dígitos) o "s.f." — el validador APA determina si el formato es correcto.
 *
 * Captura:
 * - (Apellido, 2020)
 * - (Apellido, 2020, p. 45)
 * - (Apellido, 2020, pp. 45-50)
 * - (Apellido, s.f.)
 * - (Apellido 2020) — falta coma, error que el validador detecta
 * - (García & López, 2022)
 *
 * NO captura:
 * - (ver más abajo) — sin año
 * - f(x) — sin contenido textual con año
 * - () — vacíos
 */
const CITATION_RE = /\(([^()]*?(?:\d{4}|s\.f\.)[^()]*?)\)/g;

/**
 * Extrae citas en texto que coincidan con el patrón APA.
 * Cada match recibe un id único basado en su índice.
 */
export function extractCitations(text: string): ExtractedCitation[] {
  if (!text) return [];
  const results: ExtractedCitation[] = [];
  let match: RegExpExecArray | null;
  let index = 0;
  CITATION_RE.lastIndex = 0;

  while ((match = CITATION_RE.exec(text)) !== null) {
    results.push({
      id: `citation-${index}`,
      raw: match[0],
    });
    index++;
  }

  return results;
}
