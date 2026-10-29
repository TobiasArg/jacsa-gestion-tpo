import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { getE2EPort } from './harness-config.mjs';

let dbDirectory = null;
let child = null;
let stoppingSignal = null;
let shutdownTimer = null;
let childClosed = false;
let finalized = false;

function cleanupDatabase() {
  if (!dbDirectory) return;
  try {
    rmSync(dbDirectory, { recursive: true, force: true });
    dbDirectory = null;
  } catch (error) {
    console.error('No se pudo limpiar la base temporal de pruebas:', error);
    process.exitCode = 1;
  }
}

function finish(code) {
  if (finalized) return;
  finalized = true;
  childClosed = true;
  if (shutdownTimer) clearTimeout(shutdownTimer);
  process.exitCode = Number.isInteger(code) && code >= 0 ? code : (stoppingSignal ? 0 : 1);
  cleanupDatabase();
}

function stop(signal) {
  if (stoppingSignal || finalized) return;
  stoppingSignal = signal;
  if (!child) {
    process.exitCode = 0;
    cleanupDatabase();
    return;
  }

  shutdownTimer = setTimeout(() => {
    if (child && !childClosed) child.kill('SIGKILL');
  }, 5_000);
  shutdownTimer.unref();
  child.kill(signal);
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
process.once('exit', () => {
  if (child && !childClosed) child.kill('SIGTERM');
  cleanupDatabase();
});

try {
  const temporaryParent = tmpdir();
  if (!statSync(temporaryParent).isDirectory()) {
    throw new Error(`El directorio temporal no es un directorio: ${temporaryParent}`);
  }

  const port = getE2EPort();
  dbDirectory = mkdtempSync(join(temporaryParent, 'jacsa-playwright-'));
  child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: new URL('../../', import.meta.url),
    env: {
      ...process.env,
      APP_HOST: '127.0.0.1',
      API_PORT: String(port),
      JACSA_DB: join(dbDirectory, 'demo.sqlite'),
      JACSA_DEMO: '1',
    },
    stdio: 'inherit',
  });

  child.once('error', (error) => {
    console.error('No se pudo iniciar el servidor de pruebas:', error);
    process.exitCode = 1;
  });
  child.once('close', (code) => finish(code));
} catch (error) {
  console.error('No se pudo preparar el servidor de pruebas:', error);
  process.exitCode = 1;
  cleanupDatabase();
}
