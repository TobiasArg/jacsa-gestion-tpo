import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { getE2EPort } from './harness-config.mjs';

let dbDirectory = null;
let child = null;
let stoppingSignal = null;
let shutdownTimer = null;
let childClosed = false;
let finalized = false;
let manifestPath = null;

function cleanupDatabase() {
  if (manifestPath) {
    rmSync(manifestPath, { force: true });
    manifestPath = null;
  }
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
  if (process.env.JACSA_E2E_DB_MANIFEST) {
    const allowed = resolve('test-results/qa-preparacion');
    const requested = resolve(process.env.JACSA_E2E_DB_MANIFEST);
    if (!requested.startsWith(`${allowed}${sep}`)) throw new Error('Manifest E2E fuera de test-results/qa-preparacion');
    mkdirSync(dirname(requested), { recursive: true });
    writeFileSync(requested, JSON.stringify({ dbPath: join(dbDirectory, 'demo.sqlite'), directory: dbDirectory, port, demo: true }), { flag: 'wx', mode: 0o600 });
    manifestPath = requested;
  }
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
