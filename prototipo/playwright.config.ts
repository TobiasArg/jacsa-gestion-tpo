import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getE2EBaseURL, getE2EPort } from './tests/e2e/harness-config.mjs';

const projectDirectory = fileURLToPath(new URL('.', import.meta.url));
process.env.JACSA_E2E_DB_MANIFEST ||= resolve(projectDirectory, 'test-results/qa-preparacion/launcher.json');
const port = getE2EPort();
const baseURL = getE2EBaseURL(port);

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
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1470, height: 1000 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/e2e/start-server.mjs',
    cwd: projectDirectory,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 20_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 8_000 },
  },
});
