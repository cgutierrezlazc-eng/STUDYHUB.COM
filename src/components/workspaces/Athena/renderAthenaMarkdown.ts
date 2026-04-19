/**
 * Helper que convierte texto con formato markdown mínimo a HTML seguro.
 * Escapa HTML completamente antes de aplicar reglas para prevenir XSS.
 *
 * Reglas soportadas:
 * - Escape HTML: &, <, >, ", '
 * - Negrita: **texto** → <strong>texto</strong>
 * - Itálica: *texto* → <em>texto</em>
 * - Lista no ordenada: líneas que empiezan con "- "
 * - Lista ordenada: líneas que empiezan con "N. "
 * - Saltos de línea: \n → <br> (fuera de listas)
 *
 * Bloque 2c Athena IA.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyInlineRules(text: string): string {
  // Negrita: **x** → <strong>x</strong> (aplicar antes que itálica)
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Itálica: *x* → <em>x</em> (solo los * que no son parte de **)
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  return result;
}

export function renderAthenaMarkdown(text: string): string {
  if (!text) return '';

  // Dividir en líneas para procesar listas
  const lines = text.split('\n');
  const output: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const rawLine of lines) {
    const escaped = escapeHtml(rawLine);

    // Lista no ordenada: línea que empieza con "- "
    if (/^-\s/.test(rawLine)) {
      if (inOl) {
        output.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        output.push('<ul>');
        inUl = true;
      }
      const content = applyInlineRules(escapeHtml(rawLine.replace(/^-\s/, '')));
      output.push(`<li>${content}</li>`);
      continue;
    }

    // Lista ordenada: línea que empieza con "N. "
    if (/^\d+\.\s/.test(rawLine)) {
      if (inUl) {
        output.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        output.push('<ol>');
        inOl = true;
      }
      const content = applyInlineRules(escapeHtml(rawLine.replace(/^\d+\.\s/, '')));
      output.push(`<li>${content}</li>`);
      continue;
    }

    // Cerrar listas abiertas si la línea no es de lista
    if (inUl) {
      output.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      output.push('</ol>');
      inOl = false;
    }

    // Línea vacía → separador
    if (escaped.trim() === '') {
      output.push('<br>');
      continue;
    }

    output.push(applyInlineRules(escaped));
  }

  // Cerrar listas que quedaron abiertas
  if (inUl) output.push('</ul>');
  if (inOl) output.push('</ol>');

  return output.join('\n');
}
