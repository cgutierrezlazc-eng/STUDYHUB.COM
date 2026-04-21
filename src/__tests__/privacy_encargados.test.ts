/**
 * privacy_encargados.test.ts
 *
 * Pieza 2 del bloque bloque-legal-consolidation-v2.
 * Actualizado en bloque legal-viewer-v1 (D-L7=A): la fuente de verdad
 * es ahora docs/legal/v3.2/privacy.md (markdown canónico).
 * PrivacyPolicy.tsx es un wrapper del renderer — no contiene contenido inline.
 *
 * Valida que docs/legal/v3.2/privacy.md declara explícitamente a los
 * encargados de tratamiento requeridos por el GDPR Art. 13 y la
 * Ley 19.628 Art. 4° (Chile):
 *   Supabase, Firebase Cloud Messaging, Capacitor, Google OAuth,
 *   Zoho Mail, MercadoPago, PayPal, Anthropic (o "asistente inteligente"),
 *   Vercel, Render.
 *
 * Regla: la omisión de cualquiera de estos actores en la Política de
 * Privacidad publicada constituye un desfase legal que debe corregirse
 * antes del merge a main (gate §18.7 CLAUDE.md).
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../');
const PRIVACY_MD = path.join(ROOT, 'docs/legal/v3.2/privacy.md');
const PRIVACY_FILE = path.join(ROOT, 'src/pages/PrivacyPolicy.tsx');

const REQUIRED_PROCESSORS = [
  'Supabase',
  'Firebase Cloud Messaging',
  'Capacitor',
  'Google OAuth',
  'Zoho Mail',
  'MercadoPago',
  'PayPal',
  'Anthropic',
  'Vercel',
  'Render',
];

describe('PrivacyPolicy.tsx — encargados declarados', () => {
  it('existe el archivo', () => {
    expect(fs.existsSync(PRIVACY_FILE)).toBe(true);
  });

  it('PrivacyPolicy.tsx es un wrapper del renderer (D-L7=A)', () => {
    const content = fs.readFileSync(PRIVACY_FILE, 'utf-8');
    expect(content).toContain('LegalDocumentRenderer');
    expect(content).toContain('docKey="privacy"');
  });

  it.each(REQUIRED_PROCESSORS)('declara el encargado %s', (processor) => {
    // La fuente de verdad ahora es el markdown canónico
    const content = fs.readFileSync(PRIVACY_MD, 'utf-8');
    expect(content).toContain(processor);
  });

  it('no menciona "16 años" como edad mínima', () => {
    const content = fs.readFileSync(PRIVACY_MD, 'utf-8');
    expect(content).not.toMatch(/16\s*años/i);
  });
});
