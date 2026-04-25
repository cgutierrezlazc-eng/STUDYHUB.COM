import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { glob } from 'glob';

/**
 * Plugin: sandbox-gate-injector
 *
 * Después del build, inyecta window.SANDBOX_GATE_PASSWORD en todos los
 * HTML del sandbox (dist/renderer/sandbox/*.html).
 *
 * El valor proviene de VITE_SANDBOX_GATE_PASSWORD (env var en Vercel,
 * o .env.local en desarrollo). Sin la env var, el gate queda sin password
 * (no funciona el acceso).
 *
 * Para rotar el password:
 *   1. Cambiar VITE_SANDBOX_GATE_PASSWORD en Vercel.
 *   2. Re-desplegar (automático en cada push a main).
 */
function sandboxGateInjectorPlugin() {
  return {
    name: 'sandbox-gate-injector',
    closeBundle() {
      const password = process.env.VITE_SANDBOX_GATE_PASSWORD;
      if (!password) {
        console.warn(
          '[sandbox-gate] VITE_SANDBOX_GATE_PASSWORD no definida — gate del sandbox sin password.'
        );
        return;
      }
      const sandboxHtmlFiles = glob.sync('dist/renderer/sandbox/**/*.html');
      if (sandboxHtmlFiles.length === 0) {
        console.warn('[sandbox-gate] No se encontraron HTML en dist/renderer/sandbox/');
        return;
      }
      const snippet = `<script>window.SANDBOX_GATE_PASSWORD=${JSON.stringify(password)};</script>`;
      let injected = 0;
      for (const file of sandboxHtmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('SANDBOX_GATE_PASSWORD')) {
          // ya inyectado (idempotente)
          continue;
        }
        const updated = content.replace(
          '<script src="./_gate.js" defer></script>',
          `${snippet}\n<script src="./_gate.js" defer></script>`
        );
        if (updated !== content) {
          fs.writeFileSync(file, updated, 'utf-8');
          injected++;
        }
      }
      console.info(`[sandbox-gate] Password inyectado en ${injected} HTML del sandbox.`);
    },
  };
}

export default defineConfig({
  plugins: [react(), sandboxGateInjectorPlugin()],
  base: '/',
  root: '.',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom'],
          'vendor-capacitor': [
            '@capacitor/app',
            '@capacitor/browser',
            '@capacitor/camera',
            '@capacitor/core',
            '@capacitor/haptics',
            '@capacitor/keyboard',
            '@capacitor/share',
            '@capacitor/splash-screen',
            '@capacitor/status-bar',
          ],
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-collaboration',
            '@tiptap/extension-collaboration-cursor',
          ],
          'vendor-yjs': ['yjs', 'y-websocket'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Paquete compartido entre backend (Python) y frontend (TS espejo).
      // Ver tsconfig.json paths y scripts/verify-legal-texts-sync.sh.
      shared: path.resolve(__dirname, './shared'),
    },
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router',
      'react-router-dom',
      'lucide-react',
      '@capacitor/app',
      '@capacitor/browser',
      '@capacitor/camera',
      '@capacitor/core',
      '@capacitor/haptics',
      '@capacitor/keyboard',
      '@capacitor/share',
      '@capacitor/splash-screen',
      '@capacitor/status-bar',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-cursor',
      'yjs',
      'y-websocket',
    ],
    force: true,
    holdUntilCrawlEnd: true,
  },
  server: {
    port: 5173,
    hmr: { overlay: false },
    // Prevent immutable caching of pre-bundled deps in dev.
    // Without this, stale dep chunks (old ?v= hashes) get served from the
    // browser's HTTP cache even after Vite re-optimizes, causing duplicate
    // React instances and invalid hook call errors.
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  },
});
