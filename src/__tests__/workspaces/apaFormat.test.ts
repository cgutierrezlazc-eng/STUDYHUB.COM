/**
 * Tests TDD para apaFormat.ts — equivalente JS/TS de apa_validator.py.
 * RED: deben fallar hasta que se implemente apaFormat.
 *
 * Criterios (mapeados a los del backend):
 * 1. formatAuthor: "Apellido, I."
 * 2. formatAuthorList: 1 autor
 * 3. formatAuthorList: 2 autores con &
 * 4. formatAuthorList: 20 autores (todos, & antes del último)
 * 5. formatAuthorList: 21+ autores (primeros 19 + elipsis + último)
 * 6. formatYear: con año → "(2020)"
 * 7. formatYear: sin año → "(s.f.)"
 * 8. formatReferenceBook: sin edición
 * 9. formatReferenceBook: con edición (ordinal español)
 * 10. formatReferenceBook: ignora ciudad (APA 7 la eliminó)
 * 11. formatReferenceJournal: con DOI
 * 12. formatReferenceJournal: sin DOI, sin issue
 * 13. formatReferenceWeb: con año (sin "Recuperado de")
 * 14. formatReferenceWeb: sin año (con "Recuperado de")
 */

import { describe, it, expect } from 'vitest';
import {
  formatAuthor,
  formatAuthorList,
  formatYear,
  formatReferenceBook,
  formatReferenceJournal,
  formatReferenceWeb,
} from '../../components/workspaces/Citations/apaFormat';

describe('formatAuthor', () => {
  it('formatea "Apellido, I." para nombre simple', () => {
    expect(formatAuthor('García', 'Carlos')).toBe('García, C.');
  });

  it('formatea nombre compuesto con dos iniciales', () => {
    expect(formatAuthor('Smith', 'John Michael')).toBe('Smith, J. M.');
  });

  it('retorna solo apellido si no hay nombre', () => {
    expect(formatAuthor('Anónimo', '')).toBe('Anónimo');
  });
});

describe('formatAuthorList', () => {
  it('1 autor: solo el formato individual', () => {
    expect(formatAuthorList([['García', 'Carlos']])).toBe('García, C.');
  });

  it('2 autores: separados por & antes del último', () => {
    expect(
      formatAuthorList([
        ['García', 'Carlos'],
        ['López', 'Ana'],
      ])
    ).toBe('García, C., & López, A.');
  });

  it('3 autores: comas + & antes del último', () => {
    const result = formatAuthorList([
      ['García', 'C'],
      ['López', 'A'],
      ['Pérez', 'B'],
    ]);
    expect(result).toBe('García, C., López, A., & Pérez, B.');
  });

  it('20 autores: todos listados con & antes del último', () => {
    const authors: [string, string][] = Array.from({ length: 20 }, (_, i) => [
      `Autor${i + 1}`,
      'X',
    ]);
    const result = formatAuthorList(authors);
    expect(result).toContain('& Autor20');
    expect(result.split(',').length).toBeGreaterThan(19);
  });

  it('21 autores: primeros 19 + elipsis + último', () => {
    const authors: [string, string][] = Array.from({ length: 21 }, (_, i) => [
      `Autor${i + 1}`,
      'X',
    ]);
    const result = formatAuthorList(authors);
    expect(result).toContain('. . .');
    expect(result).toContain('Autor21');
    // El autor 20 no debe aparecer por nombre completo (está después del elipsis solo el 21)
    expect(result).not.toContain('Autor20,');
  });

  it('retorna string vacío para lista vacía', () => {
    expect(formatAuthorList([])).toBe('');
  });
});

describe('formatYear', () => {
  it('envuelve el año en paréntesis', () => {
    expect(formatYear('2020')).toBe('(2020)');
  });

  it('retorna (s.f.) cuando year es null', () => {
    expect(formatYear(null)).toBe('(s.f.)');
  });

  it('retorna (s.f.) cuando year es string vacío', () => {
    expect(formatYear('')).toBe('(s.f.)');
  });
});

describe('formatReferenceBook', () => {
  it('formatea libro sin edición', () => {
    const result = formatReferenceBook(
      'García, C.',
      '2020',
      'Psicología educativa',
      'Editorial Paidos'
    );
    expect(result).toBe('García, C. (2020). Psicología educativa. Editorial Paidos.');
  });

  it('incluye edición con ordinal español (6.ª ed.)', () => {
    const result = formatReferenceBook(
      'García, C.',
      '2020',
      'Psicología educativa',
      'Editorial Paidos',
      '6'
    );
    expect(result).toContain('(6.ª ed.)');
  });

  it('ignora ciudad (APA 7 la eliminó)', () => {
    const result = formatReferenceBook(
      'García, C.',
      '2020',
      'El título',
      'Planeta',
      undefined,
      'Santiago'
    );
    expect(result).not.toContain('Santiago');
    expect(result).toContain('Planeta');
  });
});

describe('formatReferenceJournal', () => {
  it('incluye DOI como URL completa', () => {
    const result = formatReferenceJournal(
      'García, C.',
      '2020',
      'Título del artículo',
      'Revista Latinoamericana',
      '12',
      '3',
      '45-60',
      '10.1234/rev.2020.001'
    );
    expect(result).toContain('https://doi.org/10.1234/rev.2020.001');
    expect(result).toContain('12(3)');
    expect(result).toContain('45-60');
  });

  it('omite DOI si no se provee', () => {
    const result = formatReferenceJournal(
      'García, C.',
      '2020',
      'Título',
      'Revista',
      '5',
      null,
      '10-20',
      null
    );
    expect(result).not.toContain('doi');
    expect(result).not.toContain('https://');
    // Sin issue: solo volumen sin paréntesis
    expect(result).toContain(', 5,');
  });
});

describe('formatReferenceWeb', () => {
  it('sin año: incluye Recuperado de', () => {
    const result = formatReferenceWeb(
      'García, C.',
      null,
      'Título de la página',
      'Sitio Web',
      'https://example.com',
      '15 de abril de 2026'
    );
    expect(result).toContain('(s.f.)');
    expect(result).toContain('Recuperado de');
    expect(result).toContain('15 de abril de 2026');
  });

  it('con año: NO incluye Recuperado de', () => {
    const result = formatReferenceWeb(
      'García, C.',
      '2023',
      'Título',
      'Sitio',
      'https://example.com'
    );
    expect(result).not.toContain('Recuperado de');
    expect(result).toContain('https://example.com');
    expect(result).toContain('(2023)');
  });
});
