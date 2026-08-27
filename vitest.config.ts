import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.interface.ts',
        'src/app/**/*.constant.ts',
        'src/app/**/*.d.ts',
        'src/app/**/index.ts',
        'src/app/shared/integrations/**',
        'src/app/shared/types/**',
        'src/app/shared/validators/**',
      ],
    },
  },
});