import './ConnikuWordmark.css';
import React from 'react';

export interface ConnikuWordmarkProps {
  /** True si el logo va sobre fondo oscuro (color del texto cambia a #F5F4EF) */
  onDark?: boolean;
  /** Tamaño en px. Si se omite, hereda font-size del contenedor */
  size?: number;
  /** className adicional para casos puntuales (no pisar tracking, weight, etc.) */
  className?: string;
  /** Si el wordmark es decorativo (la palabra "Conniku" ya aparece en otra parte de la página) */
  decorative?: boolean;
}

export const ConnikuWordmark: React.FC<ConnikuWordmarkProps> = ({
  onDark = false,
  size,
  className = '',
  decorative = false,
}) => {
  const classes = ['brand', onDark ? 'on-dark' : '', className].filter(Boolean).join(' ');
  const style = size ? { fontSize: `${size}px` } : undefined;
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': 'Conniku' };

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
