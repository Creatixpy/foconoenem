import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  // Server regression tests don't need Next.js's PostCSS plugin loader.
  css: { postcss: { plugins: [] } },
  test: { environment: 'node' },
});
