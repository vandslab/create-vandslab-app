import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const src = (...segments: string[]) => resolve(__dirname, 'src', ...segments);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@api': src('api'),
      '@controllers': src('api', 'controllers'),
      '@services': src('api', 'services'),
      '@routes': src('api', 'routes'),
      '@middlewares': src('middlewares'),
      '@config': src('config'),
      '@exceptions': src('exceptions'),
      '@interfaces': src('interfaces'),
      '@schemas': src('schemas'),
      '@enums': src('enums'),
      '@utils': src('utils'),
      '@generated': src('generated'),
      '@': src(),
    },
  },
});
