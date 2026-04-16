import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs';

/** Plugin que copia manifest.json, _locales/, e iconos al dist despues del build */
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      cpSync(resolve(__dirname, 'manifest.json'), resolve(dist, 'manifest.json'));
      cpSync(resolve(__dirname, '_locales'), resolve(dist, '_locales'), { recursive: true });
      const iconsDir = resolve(__dirname, 'src/assets/icons');
      if (existsSync(iconsDir)) {
        cpSync(iconsDir, resolve(dist, 'icons'), { recursive: true });
      }
    },
  };
}

/**
 * Plugin que convierte content scripts de ES module a IIFE autocontenidos.
 * Chrome content scripts NO pueden usar import/export.
 * Los archivos del popup y background.js SI pueden ser modules.
 */
function wrapContentScriptsAsIIFE() {
  return {
    name: 'wrap-content-scripts-iife',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      const contentScripts = ['detector.js', 'extractor.js', 'injector.js', 'passive-interceptor.js'];

      // Regex que captura TODOS los tipos de import:
      // import { x } from './path';
      // import './path';
      // import x from './path';
      const anyImportRegex = /^import\s+.*?['"]([^'"]+)['"];?\s*$/gm;

      for (const file of contentScripts) {
        const filePath = resolve(dist, file);
        if (!existsSync(filePath)) continue;

        let code = readFileSync(filePath, 'utf-8');

        // Encontrar todos los chunks importados
        const importedChunks: string[] = [];
        let match;
        const regex = new RegExp(anyImportRegex.source, 'gm');

        while ((match = regex.exec(code)) !== null) {
          const chunkRelPath = match[1];
          const resolvedPath = resolve(dist, chunkRelPath.replace(/^\.\//, ''));
          if (existsSync(resolvedPath) && !importedChunks.includes(resolvedPath)) {
            importedChunks.push(resolvedPath);
          }
        }

        // Construir bundle autocontenido
        let bundled = '(function() {\n';

        // Resolver e inlinear chunks recursivamente
        const inlined = new Set<string>();

        function inlineChunk(chunkPath: string): string {
          if (inlined.has(chunkPath)) return '';
          inlined.add(chunkPath);

          let chunkCode = readFileSync(chunkPath, 'utf-8');

          // Primero resolver sub-imports del chunk
          const subRegex = new RegExp(anyImportRegex.source, 'gm');
          let subMatch;
          const subChunks: Array<{ stmt: string; path: string }> = [];

          while ((subMatch = subRegex.exec(chunkCode)) !== null) {
            const subRelPath = subMatch[1];
            const subResolved = resolve(resolve(chunkPath, '..'), subRelPath);
            if (existsSync(subResolved)) {
              subChunks.push({ stmt: subMatch[0], path: subResolved });
            }
          }

          // Inlinear sub-chunks y remover sus imports
          for (const sub of subChunks) {
            const subCode = inlineChunk(sub.path);
            chunkCode = chunkCode.replace(sub.stmt, subCode);
          }

          // Remover export statements
          chunkCode = chunkCode.replace(/^export\s*\{[^}]*\};?\s*$/gm, '');

          return chunkCode;
        }

        // Inlinear todos los chunks importados
        for (const chunkPath of importedChunks) {
          bundled += inlineChunk(chunkPath) + '\n';
        }

        // Remover TODOS los imports del entry point
        code = code.replace(new RegExp(anyImportRegex.source, 'gm'), '');

        bundled += code;
        bundled += '\n})();';

        writeFileSync(filePath, bundled);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles(), wrapContentScriptsAsIIFE()],
  base: '',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
        detector: resolve(__dirname, 'src/content/detector.ts'),
        extractor: resolve(__dirname, 'src/content/extractor.ts'),
        injector: resolve(__dirname, 'src/content/injector.ts'),
        'passive-interceptor': resolve(__dirname, 'src/content/passive-interceptor.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js';
          if (chunk.name === 'detector') return 'detector.js';
          if (chunk.name === 'extractor') return 'extractor.js';
          if (chunk.name === 'injector') return 'injector.js';
          if (chunk.name === 'passive-interceptor') return 'passive-interceptor.js';
          return 'popup/[name].js';
        },
        chunkFileNames: 'popup/chunks/[name]-[hash].js',
        assetFileNames: 'popup/assets/[name]-[hash][extname]',
      },
    },
    target: 'esnext',
    assetsDir: 'popup/assets',
    // Chrome Web Store rechaza codigo minificado/ofuscado — requiere codigo legible
    minify: false,
    // Source maps habilitados para desarrollo. Desactivar antes de publicar en CWS.
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@adapters': resolve(__dirname, 'src/content/adapters'),
    },
  },
});
