import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './') },
  },
});
