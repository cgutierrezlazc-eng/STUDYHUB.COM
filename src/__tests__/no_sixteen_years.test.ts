/**
 * no_sixteen_years.test.ts
 *
 * Valida que ningún archivo de interfaz de usuario (src/pages/, src/components/)
 * mencione "16 años" o variantes como texto legal visible al usuario.
 *
 * Regla operacional: Conniku es una plataforma exclusiva para mayores de 18 años
 * (CLAUDE.md §Cumplimiento Legal — "plataforma exclusiva para adultos").
 *
 * Exclusiones del escaneo:
 * - Archivos en /archive/ o /drafts/ (históricos)
 * - Archivos de test (__tests__, .test., .spec.)
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../');
const DIRS_TO_SCAN = [path.join(ROOT, 'src/pages'), path.join(ROOT, 'src/components')];

const SIXTEEN_PATTERN = /16[\s]*años?/gi;

function collectFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function shouldExclude(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.includes('/archive/') ||
    normalized.includes('/drafts/') ||
    normalized.includes('__tests__') ||
    normalized.includes('.test.') ||
    normalized.includes('.spec.')
  );
}

describe('Política 18+ — sin referencias a 16 años en UI', () => {
  it('no debe existir "16 años" (o variante) en src/pages/ ni src/components/', () => {
    const allFiles: string[] = [];
    for (const dir of DIRS_TO_SCAN) {
      collectFiles(dir, allFiles);
    }

    const matches: { file: string; line: number; text: string }[] = [];

    for (const filePath of allFiles) {
      if (shouldExclude(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        if (SIXTEEN_PATTERN.test(lineText)) {
          matches.push({
            file: path.relative(ROOT, filePath),
            line: idx + 1,
            text: lineText.trim(),
          });
        }
        // Resetear lastIndex del regex global tras cada prueba
        SIXTEEN_PATTERN.lastIndex = 0;
      });
    }

    if (matches.length > 0) {
      const detail = matches.map((m) => `  ${m.file}:${m.line} → "${m.text}"`).join('\n');
      throw new Error(
        `Se encontraron ${matches.length} referencia(s) a "16 años" que deben ser "18 años":\n${detail}`
      );
    }

    expect(matches).toHaveLength(0);
  });
});
