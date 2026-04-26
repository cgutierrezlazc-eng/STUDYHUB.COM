import './ConnikuWordmark.css';
import React from 'react';

/**
 * Conniku Wordmark · logo oficial
 *
 * Props:
 *  - onDark (boolean) — true si el logo va sobre fondo oscuro
 *  - size (number) — tamaño en px (opcional, hereda font-size si se omite)
 *  - className (string) — clase extra
 *  - decorative (boolean) — true si la palabra ya aparece en otra parte de la página
 */
export const ConnikuWordmark = ({
  onDark = false,
  size,
  className = '',
  decorative = false,
}) => {
  const classes = ['brand', onDark ? 'on-dark' : '', className].filter(Boolean).join(' ');
  const style = size ? { fontSize: `${size}px` } : undefined;
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': 'Conniku' };

  return (
    <span className={classes} style={style} {...a11y}>
      conn<span>i</span>
      <span className="k-letter">k</span>
      <span className="u-pack">
        <span className="u-letter">u</span>
        <span className="dot" />
      </span>
    </span>
  );
};

export default ConnikuWordmark;
