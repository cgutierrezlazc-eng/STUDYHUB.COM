/**
 * MathRenderer — componente que renderiza LaTeX con KaTeX.
 *
 * Usa katex.renderToString() con throwOnError: false.
 * Si KaTeX lanza (sintaxis muy inválida), muestra un span de error con tooltip.
 * XSS: KaTeX sanitiza internamente; no se permite HTML arbitrario en el output.
 *
 * Bloque 2d.3 KaTeX render LaTeX.
 */

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  latex: string;
  inline: boolean;
}

export default function MathRenderer({ latex, inline }: MathRendererProps): React.ReactElement {
  const { html, error } = useMemo(() => {
    try {
      const rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: !inline,
        output: 'html',
      });
      // KaTeX con throwOnError:false inyecta un span.katex-error cuando hay error
      // pero no lanza. Necesitamos detectar si el output contiene ese span de error.
      const hasKatexError = rendered.includes('katex-error');
      return { html: rendered, error: hasKatexError ? 'Ecuación inválida' : null };
    } catch (e) {
      // throwOnError:false no debería llegar aquí, pero por seguridad:
      const msg = e instanceof Error ? e.message : 'Error al renderizar ecuación';
      return { html: null, error: msg };
    }
  }, [latex, inline]);

  if (error && html === null) {
    // Error total (no HTML generado)
    return (
      <span className="ws-math-error" title={error} aria-label={`Error en ecuación: ${error}`}>
        {latex || '∅'}
      </span>
    );
  }

  if (error && html !== null) {
    // KaTeX generó algo pero con error interno (katex-error span)
    return (
      <span
        className="ws-math-error"
        title={error}
        aria-label={`Ecuación con error: ${error}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Render exitoso
  if (inline) {
    return (
      <span
        className="ws-math-inline"
        aria-label={`Ecuación: ${latex}`}
        dangerouslySetInnerHTML={{ __html: html ?? '' }}
      />
    );
  }

  return (
    <div
      className="ws-math-block"
      aria-label={`Ecuación en bloque: ${latex}`}
      dangerouslySetInnerHTML={{ __html: html ?? '' }}
    />
  );
}
