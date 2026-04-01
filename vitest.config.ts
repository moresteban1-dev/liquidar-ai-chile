import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@/': path.resolve(__dirname, './src') + '/',
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@core/': path.resolve(__dirname, './src/core') + '/',
            '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
            '@infrastructure/': path.resolve(__dirname, './src/infrastructure') + '/',
            '@tests': path.resolve(__dirname, './tests'),
            '@tests/': path.resolve(__dirname, './tests') + '/',
            '@shared': path.resolve(__dirname, './src/core/shared'),
            '@shared/': path.resolve(__dirname, './src/core/shared') + '/',
            '@app': path.resolve(__dirname, './src/core/application'),
            '@app/': path.resolve(__dirname, './src/core/application') + '/',
            '@domain': path.resolve(__dirname, './src/core/domain'),
            '@domain/': path.resolve(__dirname, './src/core/domain') + '/',
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        include: [
            'src/**/*.test.ts',
            'tests/**/*.test.ts',
            'tests/**/*.spec.ts',
        ],
        exclude: [
            'tests/e2e/**',
            'node_modules/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary', 'lcov', 'html'],
            include: [
                'src/core/**',
                'src/infrastructure/**',
            ],
            exclude: [
                'src/infrastructure/di/**',
                '**/*.d.ts',
                '**/*.test.ts',
            ],
            thresholds: {
                branches: 85,
                functions: 85,
                lines: 85,
                statements: 85,
            },
        },
        testTimeout: 15000,
        hookTimeout: 10000,
        sequence: {
            shuffle: true,
        },
        reporters: ['default'],
    },
});
