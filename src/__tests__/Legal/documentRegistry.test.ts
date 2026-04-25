/**
 * Tests para documentRegistry.ts
 * RED: deben fallar porque el módulo no existe aún.
 */
import { describe, it, expect } from 'vitest';

// Importación dinámica para poder capturar error si no existe
describe('documentRegistry', () => {
  it('exporta exactamente 4 entradas de documentos legales', async () => {
    const { LEGAL_DOCUMENT_REGISTRY } = await import('../../legal/documentRegistry');
    expect(Object.keys(LEGAL_DOCUMENT_REGISTRY)).toHaveLength(4);
  });

  it('contiene todas las claves requeridas', async () => {
    const { LEGAL_DOCUMENT_REGISTRY } = await import('../../legal/documentRegistry');
    const keys = Object.keys(LEGAL_DOCUMENT_REGISTRY);
    expect(keys).toContain('terms');
    expect(keys).toContain('privacy');
    expect(keys).toContain('cookies');
    expect(keys).toContain('age-declaration');
  });

  it('cada entrada tiene title, version y sha256', async () => {
    const { LEGAL_DOCUMENT_REGISTRY } = await import('../../legal/documentRegistry');
    for (const [key, entry] of Object.entries(LEGAL_DOCUMENT_REGISTRY)) {
      expect(entry, `entrada ${key} debe tener title`).toHaveProperty('title');
      expect(entry, `entrada ${key} debe tener version`).toHaveProperty('version');
      expect(entry, `entrada ${key} debe tener sha256`).toHaveProperty('sha256');
    }
  });

  it('los hashes de metadata coinciden con los valores conocidos del METADATA.yaml', async () => {
    const { LEGAL_DOCUMENT_REGISTRY } = await import('../../legal/documentRegistry');
    // Hashes tomados de docs/legal/v3.2/METADATA.yaml
    expect(LEGAL_DOCUMENT_REGISTRY['terms'].sha256).toBe(
      '9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce'
    );
    expect(LEGAL_DOCUMENT_REGISTRY['privacy'].sha256).toBe(
      'a09d799c7f34d7100b9393ad7c55c54931ab7e396d0f03b559a59545638e6962'
    );
    expect(LEGAL_DOCUMENT_REGISTRY['cookies'].sha256).toBe(
      '80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c'
    );
    // age-declaration: hash del archivo .md (no del texto canónico)
    expect(LEGAL_DOCUMENT_REGISTRY['age-declaration'].sha256).toBe(
      '61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b'
    );
  });

  it('la función getDocumentTitle devuelve el título correcto', async () => {
    const { getDocumentTitle } = await import('../../legal/documentRegistry');
    expect(getDocumentTitle('terms')).toBe('Términos y Condiciones');
    expect(getDocumentTitle('privacy')).toBe('Política de Privacidad');
    expect(getDocumentTitle('cookies')).toBe('Política de Cookies');
    expect(getDocumentTitle('age-declaration')).toBe('Declaración de Edad');
  });
});
