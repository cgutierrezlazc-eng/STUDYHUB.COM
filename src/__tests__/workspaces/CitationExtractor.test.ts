/**
 * Tests TDD para CitationExtractor.
 * RED: deben fallar hasta que se implemente extractCitations.
 *
 * Criterios:
 * 1. Extrae una cita simple (Autor, año)
 * 2. Extrae múltiples citas
 * 3. Ignora paréntesis que no son citas
 * 4. Detecta cita con página (p. X)
 * 5. Detecta cita sin coma (forma con error)
 * 6. Detecta cita con s.f.
 * 7. Ignora paréntesis vacíos
 * 8. Extrae cita con autores múltiples (& o et al.)
 * 9. Genera IDs únicos por índice
 * 10. Retorna arreglo vacío si no hay citas
 */

import { describe, it, expect } from 'vitest';
import { extractCitations } from '../../components/workspaces/Citations/CitationExtractor';

describe('extractCitations — casos básicos', () => {
  it('extrae una cita simple (Autor, año)', () => {
    const result = extractCitations('El fenómeno es conocido (García, 2020).');
    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('(García, 2020)');
    expect(result[0].id).toBeDefined();
  });

  it('extrae múltiples citas del texto', () => {
    const text = 'Ver (García, 2020) y también (López, 2018) para más detalle.';
    const result = extractCitations(text);
    expect(result).toHaveLength(2);
    expect(result[0].raw).toBe('(García, 2020)');
    expect(result[1].raw).toBe('(López, 2018)');
  });

  it('retorna arreglo vacío si no hay citas', () => {
    expect(extractCitations('Sin referencias aquí.')).toHaveLength(0);
    expect(extractCitations('')).toHaveLength(0);
  });

  it('ignora paréntesis que no contienen un año', () => {
    const text = 'La función f(x) no es una cita. Tampoco (ver más abajo).';
    const result = extractCitations(text);
    expect(result).toHaveLength(0);
  });
});

describe('extractCitations — variantes de formato', () => {
  it('detecta cita con número de página (p. X)', () => {
    const result = extractCitations('Según el autor (Martínez, 2019, p. 45).');
    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('(Martínez, 2019, p. 45)');
  });

  it('detecta cita sin fecha (s.f.)', () => {
    const result = extractCitations('Como indica (Rodríguez, s.f.).');
    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('(Rodríguez, s.f.)');
  });

  it('detecta cita con error: sin coma entre autor y año', () => {
    // El regex base captura (contenido con año) — el validador detectará el error
    const result = extractCitations('Afirma (Pérez 2021) en su estudio.');
    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('(Pérez 2021)');
  });

  it('extrae cita con múltiples autores usando &', () => {
    const result = extractCitations('Demostrado por (García & López, 2022).');
    expect(result).toHaveLength(1);
    expect(result[0].raw).toBe('(García & López, 2022)');
  });
});

describe('extractCitations — IDs', () => {
  it('genera IDs únicos (diferentes entre sí)', () => {
    const text = 'Ver (García, 2020) y (López, 2018).';
    const result = extractCitations(text);
    expect(result[0].id).not.toBe(result[1].id);
  });

  it('los IDs son strings no vacíos', () => {
    const result = extractCitations('(García, 2020)');
    expect(typeof result[0].id).toBe('string');
    expect(result[0].id.length).toBeGreaterThan(0);
  });
});
