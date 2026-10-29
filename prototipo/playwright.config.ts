import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/playwright-report/html', open: 'never' }],
  ],
  outputDir: 'test-results/playwright-report/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    browserName: 'chromium',
    viewport: { width: 1470, height: 1000 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/e2e/start-server.mjs',
    cwd: process.cwd(),
    url: 'http://127.0.0.1:3001/api/health',
    reuseExistingServer: false,
    timeout: 20_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
});
