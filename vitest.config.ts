import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Mirrors the `define` block in vite.config.ts so modules that read the
  // build stamps are testable without standing up a real build.
  define: {
    __BUILD_ID__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify('1970-01-01T00:00:00.000Z'),
    __CACHE_EPOCH__: JSON.stringify(1),
  },
  test: {
    environment: 'happy-dom',
    globals: false,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './') },
  },
});
