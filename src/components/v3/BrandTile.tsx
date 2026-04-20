/**
 * BrandTile — N3
 *
 * Componente del logo tile (app icon) según especificación LOGO.04.
 * SVG canónico copiado literal desde 00-BRAND-LOGO.md.
 *
 * REGLAS INVIOLABLES (00-BRAND-LOGO.md §LOGO.02):
 *   - tile fill        == #D9FF3A · siempre · sin excepción
 *   - u fill           == #0D0F10 · siempre · sin excepción (INVIOLABLE)
 *   - dot fill         == #FF4A1C · siempre · sin excepción (INVIOLABLE)
 *   - border_radius    == 22 (= 22% of side)
 *   - sin gradientes, filtros, sombras, ni efectos adicionales
 */
import React from 'react';

interface BrandTileProps {
  /** Tamaño del tile en px. Default 28. */
  size?: number;
  className?: string;
}

export default function BrandTile({ size = 28, className = '' }: BrandTileProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Conniku"
      width={size}
      height={size}
      className={className}
      aria-hidden="false"
    >
      {/* Fondo lime · INVIOLABLE */}
      <rect width="100" height="100" rx="22" fill="#D9FF3A" />
      {/* Letra u · color ink · INVIOLABLE */}
      <text
        x="50"
        y="71"
        textAnchor="middle"
        fontFamily="Funnel Display, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="84"
        fill="#0D0F10"
        letterSpacing="-4"
      >
        u
      </text>
      {/* Punto · color orange · INVIOLABLE */}
      <circle cx="77" cy="68" r="6" fill="#FF4A1C" />
    </svg>
  );
}
