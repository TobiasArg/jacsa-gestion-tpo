import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

const dbDirectory = mkdtempSync(join(tmpdir(), 'jacsa-playwright-'));
const child = spawn(process.execPath, ['server/index.mjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    APP_HOST: '127.0.0.1',
    API_PORT: '3001',
    JACSA_DB: join(dbDirectory, 'demo.sqlite'),
    JACSA_DEMO: '1',
  },
  stdio: 'inherit',
});

let stoppingSignal = null;
let shutdownTimer = null;

function stop(signal) {
  if (stoppingSignal) return;
  stoppingSignal = signal;
  child.kill(signal);
  shutdownTimer = setTimeout(() => child.kill('SIGKILL'), 5_000);
  shutdownTimer.unref();
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));

child.once('error', (error) => {
  console.error('No se pudo iniciar el servidor de pruebas:', error);
  rmSync(dbDirectory, { recursive: true, force: true });
  process.exitCode = 1;
});

child.once('exit', (code) => {
  if (shutdownTimer) clearTimeout(shutdownTimer);
  rmSync(dbDirectory, { recursive: true, force: true });
  process.exitCode = code ?? (stoppingSignal ? 0 : 1);
});
