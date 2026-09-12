import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  plugins: [
    // NestJS dependency injection reads emitDecoratorMetadata, which esbuild
    // (Vitest's default transformer) does not produce. SWC does.
    swc.vite({ module: { type: 'es6' } }),
  ],
});
