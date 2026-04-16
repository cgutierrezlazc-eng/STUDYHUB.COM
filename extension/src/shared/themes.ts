// ═══════════════════════════════════════════════════════════════
// TEMAS — Coinciden con los temas de Conniku (conniku.com)
// El tema del usuario se carga al login y se aplica via CSS vars
// ═══════════════════════════════════════════════════════════════

export interface Theme {
  id: string;
  name: string;
  vars: Record<string, string>;
}

export const THEMES: Record<string, Theme> = {
  oceano: {
    id: 'oceano',
    name: 'Oceano',
    vars: {
      '--bg': '#0c1829',
      '--bg-card': '#111f36',
      '--bg-hover': '#162a47',
      '--border': 'rgba(79, 140, 255, 0.15)',
      '--accent': '#4f8cff',
      '--accent-hover': '#2563eb',
      '--accent-glow': 'rgba(79, 140, 255, 0.15)',
      '--text': '#e4eaf5',
      '--text-muted': '#7a8fac',
      '--success': '#34d399',
      '--warning': '#fbbf24',
      '--error': '#ef4444',
    },
  },
  conniku: {
    id: 'conniku',
    name: 'Conniku',
    vars: {
      '--bg': '#0f0f14',
      '--bg-card': '#1a1a24',
      '--bg-hover': '#22222e',
      '--border': 'rgba(167, 139, 250, 0.15)',
      '--accent': '#a78bfa',
      '--accent-hover': '#7c3aed',
      '--accent-glow': 'rgba(167, 139, 250, 0.12)',
      '--text': '#f0eeff',
      '--text-muted': '#9390b0',
      '--success': '#4ade80',
      '--warning': '#fbbf24',
      '--error': '#ef4444',
    },
  },
};

/** Tema por defecto */
export const DEFAULT_THEME = 'oceano';

/** Aplica un tema al document root */
export function applyTheme(themeId: string): void {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}
