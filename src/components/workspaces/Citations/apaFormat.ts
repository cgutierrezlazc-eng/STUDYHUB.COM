/**
 * apaFormat.ts — Formateo de referencias y autores APA 7 en frontend puro.
 * Equivalente JS/TS de backend/apa_validator.py.
 *
 * Funciones puras sin dependencias externas.
 * Sub-bloque 2d.1 APA 7 + citas + referencias.
 *
 * Fuente: Publication Manual of the American Psychological Association, 7ª ed.,
 * 2020. https://apastyle.apa.org/style-grammar-guidelines/references
 */

// ─── Autores ─────────────────────────────────────────────────────────────────

/** Extrae iniciales con punto de un nombre (puede ser compuesto). */
function _initials(firstName: string): string {
  if (!firstName.trim()) return '';
  return firstName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(' ');
}

/** Formatea un autor único como "Apellido, I." siguiendo APA 7. */
export function formatAuthor(last: string, first: string): string {
  const lastClean = (last ?? '').trim();
  const initials = _initials(first ?? '');
  return initials ? `${lastClean}, ${initials}` : lastClean;
}

/**
 * Formatea una lista de autores según APA 7.
 * - 1 autor: "Apellido, I."
 * - 2-20 autores: todos, unidos con ", " y "& " antes del último
 * - 21+ autores: primeros 19, ". . .", último (sin "&")
 */
export function formatAuthorList(authors: [string, string][]): string {
  if (!authors.length) return '';
  const formatted = authors.map(([last, first]) => formatAuthor(last, first));
  const n = formatted.length;
  if (n === 1) return formatted[0];
  if (n <= 20) {
    return `${formatted.slice(0, -1).join(', ')}, & ${formatted[n - 1]}`;
  }
  // 21+ autores: primeros 19 + elipsis + último
  return `${formatted.slice(0, 19).join(', ')}, . . . ${formatted[n - 1]}`;
}

// ─── Año ─────────────────────────────────────────────────────────────────────

/** Envuelve el año en paréntesis. Sin año → "(s.f.)" (sin fecha, ES). */
export function formatYear(year: string | null | undefined): string {
  if (year == null) return '(s.f.)';
  const s = String(year).trim();
  return s ? `(${s})` : '(s.f.)';
}

// ─── Referencias ─────────────────────────────────────────────────────────────

function _ordinalEditionEs(edition: string): string {
  return `${edition.trim()}.ª ed.`;
}

/**
 * Formatea una referencia de libro APA 7.
 * Formato: `Autor. (año). Título (edición). Editorial.`
 * APA 7 eliminó la ciudad editorial; si se pasa city, se ignora.
 */
export function formatReferenceBook(
  author: string,
  year: string | null | undefined,
  title: string,
  publisher: string,
  edition?: string | null,
  city?: string | null
): string {
  void city; // APA 7 eliminó la ciudad
  const yearStr = formatYear(year);
  const titleClean = (title ?? '').trim();
  const publisherClean = (publisher ?? '').trim();
  const titleWithEd =
    edition && String(edition).trim()
      ? `${titleClean} (${_ordinalEditionEs(String(edition))})`
      : titleClean;
  return `${author} ${yearStr}. ${titleWithEd}. ${publisherClean}.`;
}

/**
 * Formatea una referencia de artículo de revista APA 7.
 * Formato: `Autor. (año). Título. Revista, vol(issue), páginas. doi`
 */
export function formatReferenceJournal(
  author: string,
  year: string | null | undefined,
  title: string,
  journal: string,
  volume: string | null | undefined,
  issue: string | null | undefined,
  pages: string | null | undefined,
  doi: string | null | undefined
): string {
  const yearStr = formatYear(year);
  const titleClean = (title ?? '').trim();
  const journalClean = (journal ?? '').trim();
  const volStr = volume != null ? String(volume).trim() : '';
  const volumePart =
    issue != null && String(issue).trim() ? `${volStr}(${String(issue).trim()})` : volStr;
  const pagesPart = pages?.trim() ? `, ${pages.trim()}` : '';
  let doiPart = '';
  if (doi?.trim()) {
    const doiClean = doi.trim();
    doiPart = ` ${doiClean.startsWith('http') ? doiClean : `https://doi.org/${doiClean}`}`;
  }
  return `${author} ${yearStr}. ${titleClean}. ${journalClean}, ${volumePart}${pagesPart}.${doiPart}`;
}

/**
 * Formatea una referencia web APA 7.
 * - Con fecha de publicación: sin "Recuperado de"
 * - Sin fecha: con "Recuperado de [fecha]"
 */
export function formatReferenceWeb(
  author: string,
  year: string | null | undefined,
  title: string,
  site: string,
  url: string,
  retrieved?: string | null
): string {
  const yearStr = formatYear(year);
  const titleClean = (title ?? '').trim();
  const siteClean = (site ?? '').trim();
  const urlClean = (url ?? '').trim();
  const base = `${author} ${yearStr}. ${titleClean}. ${siteClean}.`;
  const hasYear = year != null && String(year).trim() !== '';
  if (!hasYear) {
    if (retrieved?.trim()) {
      return `${base} Recuperado de ${retrieved.trim()}, ${urlClean}`;
    }
    return `${base} Recuperado de ${urlClean}`;
  }
  return `${base} ${urlClean}`;
}
