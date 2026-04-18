import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  root: '.',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
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
})
