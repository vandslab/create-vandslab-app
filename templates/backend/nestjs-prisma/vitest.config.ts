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
      '@common': resolve(__dirname, './src/common'),
      '@decorators': resolve(__dirname, './src/decorators'),
      '@guards': resolve(__dirname, './src/guards'),
      '@modules': resolve(__dirname, './src/modules'),
      '@interfaces': resolve(__dirname, './src/interfaces'),
      '@interceptors': resolve(__dirname, './src/common/interceptors'),
    },
  },
  plugins: [
    // NestJS dependency injection reads emitDecoratorMetadata, which esbuild
    // (Vitest's default transformer) does not produce. SWC does.
    swc.vite({ module: { type: 'es6' } }),
  ],
});
