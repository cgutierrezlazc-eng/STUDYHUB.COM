/**
 * cookies_policy.test.tsx
 *
 * Pieza 5 del bloque bloque-legal-consolidation-v2.
 * Actualizado en bloque legal-viewer-v1 (D-L7=A): la fuente de verdad
 * es ahora docs/legal/v3.2/cookies.md (markdown canónico).
 * CookiesPolicy.tsx es un wrapper del renderer — no contiene contenido inline.
 *
 * Valida que la Política de Cookies canónica:
 *  - Existe en docs/legal/v3.2/cookies.md
 *  - Declara las categorías mínimas requeridas por GDPR y ePrivacy.
 *  - Incluye las claves reales de localStorage que Conniku instala hoy.
 *  - Afirma que Conniku no usa cookies de terceros publicitarios.
 *  - Ofrece un camino verificable para ejercer derechos (correo).
 *
 * El render runtime (react-markdown) garantiza que el usuario ve exactamente
 * este contenido (cierre BUG GDPR Art. 7(1)).
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../');
const COOKIES_MD = path.join(ROOT, 'docs/legal/v3.2/cookies.md');

function readMarkdown(): string {
  return fs.readFileSync(COOKIES_MD, 'utf-8');
}

describe('CookiesPolicy', () => {
  it('existe el markdown canónico docs/legal/v3.2/cookies.md', () => {
    expect(fs.existsSync(COOKIES_MD)).toBe(true);
  });

  it('declara las claves reales de almacenamiento local', () => {
    const content = readMarkdown();
    expect(content).toContain('conniku_token');
    expect(content).toContain('conniku_refresh_token');
    expect(content).toContain('conniku_language');
    expect(content).toContain('conniku_theme');
  });

  it('menciona Service Worker (PWA) como tecnología equivalente', () => {
    expect(readMarkdown()).toMatch(/Service Worker/i);
  });

  it('declara las bases legales (Ley 19.628, RGPD, ePrivacy)', () => {
    const content = readMarkdown();
    expect(content).toContain('19.628');
    expect(content).toMatch(/RGPD|GDPR|2016\/679/);
    expect(content).toMatch(/ePrivacy|2002\/58/);
  });

  it('afirma que Conniku no usa cookies de terceros con fines publicitarios', () => {
    expect(readMarkdown()).toMatch(/no utiliza cookies de terceros/i);
  });

  it('ofrece un camino verificable para ejercer derechos (correo @conniku.com)', () => {
    // El markdown canónico usa legal@conniku.com o dpo@conniku.com para derechos GDPR
    // (privacidad@conniku.com era el correo del JSX anterior, pre D-L7=A)
    const content = readMarkdown();
    expect(content).toMatch(/@conniku\.com/);
  });

  it('CookiesPolicy.tsx existe y es un wrapper del renderer', () => {
    const tsxPath = path.join(ROOT, 'src/pages/CookiesPolicy.tsx');
    const content = fs.readFileSync(tsxPath, 'utf-8');
    expect(content).toContain('LegalDocumentRenderer');
    expect(content).toContain('docKey="cookies"');
  });
});
