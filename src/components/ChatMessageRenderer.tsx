/**
 * ChatMessageRenderer — renderiza mensajes de chat con soporte de:
 * - LaTeX inline: $...$
 * - LaTeX en bloque: $$...$$
 * - Markdown básico defensivo: **bold**, listas numeradas, saltos de línea
 * - Texto plano con HTML-escaping seguro
 */
import React, { useMemo } from 'react';
import katex from 'katex';

interface Props {
  content: string;
}

// Divide el texto en segmentos: texto plano | math inline | math bloque
const MATH_SPLIT = /(\$\$[\s\S]*?\$\$|\$[^$\n]{1,400}?\$)/;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderKatex(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
    });
  } catch {
    return `<code>${escapeHtml(math)}</code>`;
  }
}

function renderTextSegment(text: string): string {
  // Escapa HTML primero
  let s = escapeHtml(text);

  // Defensivo: convierte **bold** que el asistente a veces produce igual
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  // Encabezados que el asistente puede producir → negrita
  s = s.replace(/^#{1,6} (.+)$/gm, '<strong>$1</strong>');

  // Listas con guión → bullet
  s = s.replace(/^[-•]\s+(.+)$/gm, '• $1');

  // Saltos de línea → <br>
  s = s.replace(/\n/g, '<br>');

  return s;
}

function buildHtml(content: string): string {
  // Divide por delimitadores math (regex con grupo de captura)
  const parts = content.split(MATH_SPLIT);

  return parts
    .map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        return renderKatex(part.slice(2, -2), true);
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        return renderKatex(part.slice(1, -1), false);
      }
      return renderTextSegment(part);
    })
    .join('');
}

export default function ChatMessageRenderer({ content }: Props) {
  const html = useMemo(() => buildHtml(content), [content]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
