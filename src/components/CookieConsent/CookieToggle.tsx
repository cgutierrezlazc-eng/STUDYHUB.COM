/**
 * CookieToggle.tsx — Switch accesible individual por categoría de cookies.
 *
 * Implementa WAI-ARIA role="switch" conforme a WCAG 2.1.
 * Invariante I-03: toggles no esenciales OFF por defecto (Planet49 C-673/17).
 *
 * Pieza 2 del bloque bloque-cookie-consent-banner-v1.
 */
import React from 'react';

export interface CookieToggleProps {
  /** Identificador único de la categoría (usado en aria-labelledby). */
  id: string;
  /** Etiqueta visible del toggle. */
  label: string;
  /** Estado actual del toggle. */
  checked: boolean;
  /** Si es true, el toggle está desactivado (categoría "necessary" siempre ON). */
  disabled?: boolean;
  /** Callback al cambiar estado. */
  onChange?: (checked: boolean) => void;
}

export default function CookieToggle({
  id,
  label,
  checked,
  disabled = false,
  onChange,
}: CookieToggleProps) {
  const labelId = `${id}-label`;

  function handleClick() {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span
        id={labelId}
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
        }}
      >
        {label}
      </span>
      <button
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-testid={`cookie-toggle-${id}`}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: checked ? 'var(--accent, #2D62C8)' : 'var(--border-subtle, #d1d5db)',
          transition: 'background 160ms ease',
          padding: 0,
          flexShrink: 0,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 160ms ease',
          }}
        />
      </button>
    </div>
  );
}
