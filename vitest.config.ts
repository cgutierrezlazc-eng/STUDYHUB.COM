/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Configuración de Vitest para Conniku (TDD obligatorio CLAUDE.md).
 *
 * - Ambiente jsdom para testing de componentes React.
 * - Alias `@/*` igual que vite.config.ts para que los imports coincidan.
 * - Alias `shared/*` apunta al directorio `shared/` del monorepo (texto legal
 *   compartido con Python).
 * - Setup global carga matchers de @testing-library/jest-dom.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
      shared: "/shared",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/__tests__/**"],
    },
  },
});
