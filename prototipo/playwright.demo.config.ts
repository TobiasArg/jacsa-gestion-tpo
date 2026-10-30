import { defineConfig } from '@playwright/test';

// QA del build estático browser-demo. Sin JACSA_DEMO_URL usa `vite preview` sobre dist/ en 4190 (requiere `npm run build:demo` antes);
// con JACSA_DEMO_URL corre los mismos casos contra el despliegue público, sin servidor local.
const remoteURL = process.env.JACSA_DEMO_URL;
const port = Number(process.env.JACSA_DEMO_PORT ?? 4190);
const baseURL = remoteURL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/browser-demo',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: [['list']],
  outputDir: 'test-results/browser-demo/artifacts',
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1470, height: 1000 },
    screenshot: 'only-on-failure',
  },
  webServer: remoteURL ? undefined : {
    command: `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
