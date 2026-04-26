/**
 * Conniku · ThemeSwitcher component
 * Dropdown/grid para elegir entre los 12 temas.
 * Requiere themes.css y themes.js en el mismo folder (o ajusta los imports).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from './themes.js';

export function ThemeSwitcher() {
  const { theme, setTheme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Cambiar tema"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', borderRadius: 10,
          background: 'var(--surface-2)', color: 'var(--text)',
          border: '1px solid var(--border)',
          fontFamily: 'inherit', fontSize: 12, cursor: 'pointer'
        }}
      >
        <span style={{
          display: 'inline-block', width: 14, height: 14, borderRadius: 4,
          background: current.signature, border: '1px solid var(--border)'
        }} />
        <span>{current.name}</span>
        <span style={{ opacity: .5, fontSize: 10 }}>{current.mode}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1000,
            width: 280, padding: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.35)',
            display: 'grid', gap: 6, gridTemplateColumns: '1fr 1fr'
          }}
        >
          <div style={{
            gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '0 4px 6px',
            borderBottom: '1px solid var(--border-2)', marginBottom: 4
          }}>
            <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Tema
            </span>
            <button
              onClick={toggle}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 6,
                background: 'var(--signature)', color: 'var(--ink)',
                border: 0, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
              }}
            >
              ⇄ {current.mode === 'dark' ? 'light' : 'dark'}
            </button>
          </div>

          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              aria-pressed={t.id === theme}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 9px', borderRadius: 8,
                background: t.id === theme ? 'var(--surface-3)' : 'transparent',
                border: `1px solid ${t.id === theme ? t.signature : 'transparent'}`,
                color: 'var(--text)', fontFamily: 'inherit', fontSize: 11,
                cursor: 'pointer', textAlign: 'left'
              }}
            >
              <span style={{
                display: 'flex', borderRadius: 4, overflow: 'hidden',
                width: 36, height: 20, flexShrink: 0, border: '1px solid var(--border-2)'
              }}>
                {t.preview.map((c, i) => (
                  <span key={i} style={{ flex: 1, background: c }} />
                ))}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.name}
                <span style={{ opacity: .5, marginLeft: 4, fontSize: 9 }}>{t.mode}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
