/**
 * Tests para src/legal/cookieTexts.ts
 *
 * Verifica invariantes de los textos legales del banner de cookies:
 * - D-09: vigencia correcta de Ley 21.719 (2026-12-01, no 2026-12-13).
 * - D-02/D-03: textos de categorías marketing y functional actualizados.
 * - Versión de política bumpeada a 1.1.0.
 */

import { describe, it, expect } from 'vitest';
import {
  COOKIE_BANNER_TEXTS,
  COOKIE_CATEGORY_TEXTS,
  COOKIE_CONSENT_POLICY_VERSION,
} from '../../legal/cookieTexts';

describe('cookieTexts — invariantes legales', () => {
  // D-09: fecha de vigencia de Ley 21.719
  it('no contiene la fecha errónea 2026-12-13 en ningún texto del banner (D-09)', () => {
    const allBannerValues = Object.values(COOKIE_BANNER_TEXTS).join(' ');
    expect(allBannerValues).not.toContain('2026-12-13');
  });

  it('la versión de política es 1.1.0 tras el bump (D-02/D-03)', () => {
    expect(COOKIE_CONSENT_POLICY_VERSION).toBe('1.1.0');
  });

  // D-04: aviso de retracto presente en COOKIE_BANNER_TEXTS
  it('COOKIE_BANNER_TEXTS incluye retractNotice con texto de retracto (D-04)', () => {
    expect(COOKIE_BANNER_TEXTS.retractNotice).toContain('cambiar o retirar tu decisión');
    expect(COOKIE_BANNER_TEXTS.retractNotice).toContain('pie de la página');
  });

  // D-02: texto de categoría marketing actualizado
  it('descripción de marketing menciona que no se comparten datos con redes publicitarias (D-02)', () => {
    expect(COOKIE_CATEGORY_TEXTS.marketing.description).toContain(
      'no se comparten con redes publicitarias'
    );
    expect(COOKIE_CATEGORY_TEXTS.marketing.description).toContain(
      'futuras funcionalidades opcionales'
    );
  });

  // D-03: texto de categoría functional actualizado
  it('descripción de functional menciona que no se comparten con terceros con fines publicitarios (D-03)', () => {
    expect(COOKIE_CATEGORY_TEXTS.functional.description).toContain(
      'No se comparten con terceros con fines publicitarios'
    );
  });
});
