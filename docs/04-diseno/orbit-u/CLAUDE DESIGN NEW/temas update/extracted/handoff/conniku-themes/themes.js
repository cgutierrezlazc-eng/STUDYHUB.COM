/**
 * Conniku · Theme Registry + Switcher
 * ===================================
 *
 * - THEMES: metadata de cada tema (id, nombre, familia, modo, signature color, preview colors)
 * - useTheme(): hook React para cambiar tema con persistencia en localStorage
 * - applyTheme(): función vanilla para cambiar el tema (aplica data-theme en <html>)
 */

export const THEMES = [
  // Dark
  { id: 'ember-dark',   name: 'Ember',      family: 'ember',  mode: 'dark',  signature: '#FF4A1C', preview: ['#1F1A1A', '#26211F', '#FF4A1C', '#EFE7DC'] },
  { id: 'cosmos-dark',  name: 'Cosmos',     family: 'cosmos', mode: 'dark',  signature: '#6B4EFF', preview: ['#1A1A28', '#222236', '#6B4EFF', '#E8E5F2'] },
  { id: 'forest-dark',  name: 'Forest',     family: 'forest', mode: 'dark',  signature: '#00C27A', preview: ['#16201C', '#1E2A26', '#00C27A', '#E0E8E2'] },
  { id: 'punk-dark',    name: 'Neon Punk',  family: 'punk',   mode: 'dark',  signature: '#D9FF3A', preview: ['#181A22', '#21242E', '#D9FF3A', '#E8E8E6'] },
  { id: 'ocean-dark',   name: 'Ocean',      family: 'ocean',  mode: 'dark',  signature: '#00C2FF', preview: ['#161E26', '#1E2A36', '#00C2FF', '#DEE8F0'] },
  { id: 'amber-dark',   name: 'Amber',      family: 'amber',  mode: 'dark',  signature: '#FFE9B8', preview: ['#1E1B16', '#2A261E', '#FFE9B8', '#EFE7D5'] },
  // Light
  { id: 'ember-light',  name: 'Ember Light',  family: 'ember',  mode: 'light', signature: '#FF4A1C', preview: ['#F5EFE8', '#FFFAF2', '#FF4A1C', '#1F1A1A'] },
  { id: 'cosmos-light', name: 'Lavender',     family: 'cosmos', mode: 'light', signature: '#6B4EFF', preview: ['#F0EEF7', '#FAF8FF', '#6B4EFF', '#1A1A28'] },
  { id: 'forest-light', name: 'Mint',         family: 'forest', mode: 'light', signature: '#00C27A', preview: ['#EBF2EE', '#F8FCF9', '#00C27A', '#16201C'] },
  { id: 'punk-light',   name: 'Punk Light',   family: 'punk',   mode: 'light', signature: '#D9FF3A', preview: ['#F0F0EE', '#FAFAF8', '#D9FF3A', '#1A1D24'] },
  { id: 'ocean-light',  name: 'Sky',          family: 'ocean',  mode: 'light', signature: '#00C2FF', preview: ['#EBF1F5', '#F8FBFD', '#00C2FF', '#161E26'] },
  { id: 'amber-light',  name: 'Butter',       family: 'amber',  mode: 'light', signature: '#E8C770', preview: ['#F5EFE0', '#FFFCF2', '#E8C770', '#1E1B16'] },
];

export const DEFAULT_THEME = 'punk-dark';
const STORAGE_KEY = 'conniku-theme';

/** Aplica el tema al documento (y opcionalmente persiste). */
export function applyTheme(themeId, { persist = true } = {}) {
  if (!THEMES.find(t => t.id === themeId)) themeId = DEFAULT_THEME;
  document.documentElement.setAttribute('data-theme', themeId);
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, themeId); } catch {}
  }
}

/** Lee el tema guardado o devuelve el default. */
export function getStoredTheme() {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME; }
  catch { return DEFAULT_THEME; }
}

/** Toggle dark/light manteniendo la familia (ember-dark ↔ ember-light). */
export function toggleMode() {
  const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  const parts = current.split('-');
  const family = parts[0];
  const mode = parts[1];
  const newMode = mode === 'dark' ? 'light' : 'dark';
  applyTheme(`${family}-${newMode}`);
}

/** Inicialización (llamar una vez en el entry point, antes de renderizar React). */
export function initTheme() {
  applyTheme(getStoredTheme(), { persist: false });
}

/* ══════════════════════════════════════════════════════
   REACT HOOK (opcional · si usás React)
   ══════════════════════════════════════════════════════ */
import { useCallback, useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => { applyTheme(theme); }, [theme]);

  const setAndPersist = useCallback((id) => setTheme(id), []);

  const toggle = useCallback(() => {
    setTheme((cur) => {
      const [family, mode] = cur.split('-');
      return `${family}-${mode === 'dark' ? 'light' : 'dark'}`;
    });
  }, []);

  return { theme, setTheme: setAndPersist, toggle, themes: THEMES };
}
