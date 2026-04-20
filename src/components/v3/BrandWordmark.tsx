/**
 * BrandWordmark — N2
 *
 * Componente del wordmark de Conniku según especificación LOGO.03.
 * HTML y CSS canónicos copiados literal desde 00-BRAND-LOGO.md.
 *
 * REGLAS INVIOLABLES (00-BRAND-LOGO.md §LOGO.02):
 *   - u color          == #0D0F10 · siempre · sin excepción
 *   - dot color        == #FF4A1C · siempre · sin excepción
 *   - u-pack background == #D9FF3A · siempre · sin excepción
 *   - rotación del wordmark == 0 grados · sin rotación permitida
 *   - font_family      == Funnel Display 900 · sin sustitución
 *   - punto final "."  siempre presente · nunca omitido
 */
import React from 'react';

interface BrandWordmarkProps {
  /** Modo oscuro: cambia "connik" a color paper. Default false (sobre fondo claro). */
  onDark?: boolean;
  /** Tamaño de fuente en px. Si no se pasa, hereda del padre. */
  size?: number;
  className?: string;
}

export default function BrandWordmark({
  onDark = false,
  size,
  className = '',
}: BrandWordmarkProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'baseline',
    fontFamily: "'Funnel Display', -apple-system, sans-serif",
    fontWeight: 900,
    letterSpacing: '-.055em',
    lineHeight: 1,
    color: onDark ? '#F5F4EF' : '#0D0F10',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...(size ? { fontSize: size } : {}),
  };

  const uPackStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'baseline',
    background: '#D9FF3A',
    color: '#0D0F10' /* u siempre ink · INVIOLABLE */,
    padding: '.07em .14em .07em .09em',
    borderRadius: '.2em',
    marginLeft: '.02em',
  };

  const dotStyle: React.CSSProperties = {
    color: '#FF4A1C' /* punto siempre orange · INVIOLABLE */,
  };

  return (
    <span style={baseStyle} className={`brand ${onDark ? 'on-dark' : ''} ${className}`}>
      conn<span>i</span>k
      <span style={uPackStyle} className="u-pack">
        u
        <span style={dotStyle} className="dot">
          .
        </span>
      </span>
    </span>
  );
}
