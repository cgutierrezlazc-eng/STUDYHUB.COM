/**
 * pages-migradas-v3.smoke.test.tsx
 *
 * Smoke tests mínimos para páginas migradas al rediseño editorial v3.
 * Verifican que cada módulo se importa sin errores en top-level: sintaxis
 * válida, imports resolubles, side effects de module-load no lanzan.
 *
 * No cubre render completo (eso requeriría mockear useAuth, api, i18n,
 * theme, router por página). Red de seguridad para detectar rupturas
 * obvias introducidas por refactors globales.
 */
import { describe, it, expect } from 'vitest';

describe('pages migradas v3 — smoke import', () => {
  // Biblioteca queda fuera del smoke: carga pdfjs-dist con new URL() que
  // jsdom/vitest no resuelven. Issue documentado en docs/pendientes.md
  // como deuda de testabilidad (cargar PDFReader de forma lazy).
  const pages: Array<[string, () => Promise<{ default: unknown }>]> = [
    ['Calendar', () => import('../../pages/Calendar')],
    ['Courses', () => import('../../pages/Courses')],
    ['Events', () => import('../../pages/Events')],
    ['Quizzes', () => import('../../pages/Quizzes')],
    ['Gamification', () => import('../../pages/Gamification')],
  ];

  it.each(pages)('%s importa sin error y expone default', async (_name, importFn) => {
    const mod = await importFn();
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});
