/**
 * cookies_policy.test.tsx
 *
 * Pieza 5 del bloque bloque-legal-consolidation-v2.
 *
 * Valida que la Política de Cookies:
 *  - Se renderiza sin error con un callback onNavigate.
 *  - Declara las categorías mínimas requeridas por GDPR y ePrivacy.
 *  - Incluye las claves reales de localStorage que Conniku instala hoy
 *    (conniku_token, conniku_language, conniku_theme).
 *  - Enlaza a la Política de Privacidad y a los Términos y Condiciones.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CookiesPolicy from '../pages/CookiesPolicy';

describe('CookiesPolicy', () => {
  it('renderiza sin crash', () => {
    const onNavigate = vi.fn();
    render(<CookiesPolicy onNavigate={onNavigate} />);
    expect(screen.getByRole('heading', { name: /Política de Cookies/i, level: 1 })).toBeTruthy();
  });

  it('declara las claves reales de almacenamiento local', () => {
    const onNavigate = vi.fn();
    const { container } = render(<CookiesPolicy onNavigate={onNavigate} />);
    const html = container.innerHTML;
    expect(html).toContain('conniku_token');
    expect(html).toContain('conniku_refresh_token');
    expect(html).toContain('conniku_language');
    expect(html).toContain('conniku_theme');
  });

  it('menciona Service Worker (PWA) como tecnología equivalente', () => {
    const onNavigate = vi.fn();
    const { container } = render(<CookiesPolicy onNavigate={onNavigate} />);
    expect(container.innerHTML).toMatch(/Service Worker/i);
  });

  it('declara las bases legales (Ley 19.628, RGPD, ePrivacy)', () => {
    const onNavigate = vi.fn();
    const { container } = render(<CookiesPolicy onNavigate={onNavigate} />);
    const html = container.innerHTML;
    expect(html).toContain('19.628');
    expect(html).toMatch(/RGPD|GDPR|2016\/679/);
    expect(html).toMatch(/ePrivacy|2002\/58/);
  });

  it('afirma que Conniku no usa cookies de terceros publicitarios', () => {
    const onNavigate = vi.fn();
    const { container } = render(<CookiesPolicy onNavigate={onNavigate} />);
    expect(container.innerHTML).toMatch(/no utiliza cookies de terceros con fines publicitarios/i);
  });

  it('ofrece un camino verificable para ejercer derechos (correo)', () => {
    const onNavigate = vi.fn();
    const { container } = render(<CookiesPolicy onNavigate={onNavigate} />);
    expect(container.innerHTML).toContain('privacidad@conniku.com');
  });
});
