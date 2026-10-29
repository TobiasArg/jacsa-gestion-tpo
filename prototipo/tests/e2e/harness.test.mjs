import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { watch, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { getE2EBaseURL, getE2EPort } from './harness-config.mjs';

const projectDirectory = fileURLToPath(new URL('../../', import.meta.url));
const launcherPath = fileURLToPath(new URL('./start-server.mjs', import.meta.url));
const TEMP_DIRECTORY_PREFIX = 'jacsa-playwright-';

function makePrivateTempParent() {
  const parent = tmpdir();
  assert.equal(statSync(parent).isDirectory(), true, `Temporary parent is not a directory: ${parent}`);
  const directory = mkdtempSync(join(parent, 'jacsa-e2e-harness-test-'));
  try {
    assert.equal(statSync(directory).isDirectory(), true, `Test TMPDIR is not a directory: ${directory}`);
    return directory;
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      server.off('error', onError);
      reject(new Error(`Timed out listening on 127.0.0.1:${port}`));
    }, 2_000);
    const onError = (error) => {
      clearTimeout(timer);
      reject(error);
    };
    server.once('error', onError);
    server.listen(port, '127.0.0.1', () => {
      clearTimeout(timer);
      server.off('error', onError);
      resolve(server.address().port);
    });
  });
}

function closeServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out closing test listener')), 2_000);
    server.close((error) => {
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    });
  });
}

function launchHarness(port, temporaryParent, extraEnv = {}) {
  const child = spawn(process.execPath, [launcherPath], {
    cwd: projectDirectory,
    env: {
      ...process.env,
      JACSA_E2E_PORT: String(port),
      TMPDIR: temporaryParent,
      JACSA_E2E_DB_MANIFEST: '',
      ...extraEnv,
    },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const record = { child, closeResult: null, stdout: '', stderr: '', spawnError: null };
  child.stdout.setEncoding('utf8').on('data', (chunk) => { record.stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', (chunk) => { record.stderr += chunk; });
  child.once('error', (error) => { record.spawnError = error; });
  record.closed = new Promise((resolve) => {
    child.once('close', (code, signal) => {
      record.closeResult = { code, signal };
      resolve(record.closeResult);
    });
  });
  return record;
}

function waitForClose(record, timeoutMs) {
  if (record.closeResult) return Promise.resolve(record.closeResult);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Harness did not close within ${timeoutMs} ms`)), timeoutMs);
    record.closed.then((result) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

async function stopHarness(record) {
  if (!record || record.closeResult) return;
  record.child.kill('SIGTERM');
  try {
    await waitForClose(record, 7_000);
  } catch {
    if (process.platform !== 'win32' && record.child.pid) {
      try { process.kill(-record.child.pid, 'SIGKILL'); } catch { /* already exited */ }
    } else {
      record.child.kill('SIGKILL');
    }
    await waitForClose(record, 2_000);
  }
}

async function waitForHealth(record, port, timeoutMs = 15_000) {
  const url = `${getE2EBaseURL(port)}/api/health`;
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    if (record.closeResult) {
      throw new Error(`Harness exited before health check (${JSON.stringify(record.closeResult)}): ${record.stderr}`);
    }
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(500),
      });
      if (response.status === 200) return response;
      lastError = new Error(`Health returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  throw new Error(`Harness health check timed out: ${lastError}`);
}

async function assertPortAvailable(port) {
  const probe = createNetServer();
  try {
    await listen(probe, port);
  } finally {
    await closeServer(probe);
  }
}

function watchHarnessDirectories(parent) {
  const created = new Set();
  let error = null;
  const watcher = watch(parent, (_event, filename) => {
    if (filename === null) {
      for (const name of readdirSync(parent)) {
        if (name.startsWith(TEMP_DIRECTORY_PREFIX)) created.add(name);
      }
      return;
    }
    const name = filename.toString();
    if (name.startsWith(TEMP_DIRECTORY_PREFIX)) created.add(name);
  });
  watcher.on('error', (watchError) => { error = watchError; });
  return { watcher, created, get error() { return error; } };
}

async function waitFor(predicate, description, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out waiting for ${description}`);
}

test('E2E port defaults to 3181, accepts configured values, and rejects invalid values', { timeout: 5_000 }, () => {
  const originalValue = process.env.JACSA_E2E_PORT;
  try {
    delete process.env.JACSA_E2E_PORT;
    assert.equal(getE2EPort(), 3181);

    process.env.JACSA_E2E_PORT = '43817';
    assert.equal(getE2EPort(), 43817);
    assert.equal(getE2EBaseURL(), 'http://127.0.0.1:43817');
    assert.equal(getE2EPort('65535'), 65535);

    for (const value of ['', '0', '-1', '65536', '1.5', ' 3181', '3181\n']) {
      assert.throws(() => getE2EPort(value), /JACSA_E2E_PORT debe ser un entero entre 1 y 65535/);
    }
  } finally {
    if (originalValue === undefined) delete process.env.JACSA_E2E_PORT;
    else process.env.JACSA_E2E_PORT = originalValue;
  }
});

test('launcher serves on its configured port and removes its private DB after SIGTERM', { timeout: 30_000 }, async () => {
  const temporaryParent = makePrivateTempParent();
  const manifest = resolve(projectDirectory, 'test-results/qa-preparacion', `harness-${process.pid}.json`);
  let launcher;
  try {
    const emptyPortProbe = createNetServer();
    const port = await listen(emptyPortProbe, 0);
    await closeServer(emptyPortProbe);
    assert.ok(port > 1024, `Expected an ephemeral port, got ${port}`);

    launcher = launchHarness(port, temporaryParent, { JACSA_E2E_DB_MANIFEST: manifest });
    const health = await waitForHealth(launcher, port);
    assert.deepEqual(await health.json(), { ok: true });

    const directories = readdirSync(temporaryParent)
      .filter((name) => name.startsWith(TEMP_DIRECTORY_PREFIX));
    assert.equal(directories.length, 1, `Expected one private DB directory in ${temporaryParent}`);
    const databaseDirectory = resolve(temporaryParent, directories[0]);
    assert.equal(dirname(databaseDirectory), resolve(temporaryParent));
    assert.equal(statSync(databaseDirectory).isDirectory(), true);
    assert.equal(existsSync(join(databaseDirectory, 'demo.sqlite')), true);
    assert.deepEqual(JSON.parse(readFileSync(manifest, 'utf8')), { dbPath: join(databaseDirectory, 'demo.sqlite'), directory: databaseDirectory, port, demo: true });

    assert.equal(launcher.child.kill('SIGTERM'), true, 'SIGTERM should be sent to the owned launcher process');
    const result = await waitForClose(launcher, 8_000);
    assert.deepEqual(result, { code: 0, signal: null }, `${launcher.stdout}\n${launcher.stderr}`);
    assert.equal(existsSync(databaseDirectory), false, 'The launcher should remove its private DB directory');
    assert.equal(existsSync(manifest), false, 'The launcher should remove its manifest');
    assert.deepEqual(readdirSync(temporaryParent), [], 'The private TMPDIR should be empty after shutdown');
    await assertPortAvailable(port);
  } finally {
    try {
      await stopHarness(launcher);
    } finally {
      rmSync(temporaryParent, { recursive: true, force: true });
    }
  }
});

test('occupied port fails without stopping its owner and cleans the launcher DB', { timeout: 25_000 }, async () => {
  const temporaryParent = makePrivateTempParent();
  const sentinel = createHttpServer((request, response) => {
    response.writeHead(200, { Connection: 'close', 'Content-Type': 'text/plain' });
    response.end('sentinel');
  });
  let port;
  let launcher;
  let directoryWatcher;
  try {
    port = await listen(sentinel, 0);
    assert.ok(port > 1024, `Expected an ephemeral sentinel port, got ${port}`);
    directoryWatcher = watchHarnessDirectories(temporaryParent);
    launcher = launchHarness(port, temporaryParent);

    const result = await waitForClose(launcher, 12_000);
    assert.notEqual(result.code, 0, `${launcher.stdout}\n${launcher.stderr}`);
    assert.equal(result.signal, null, 'The launcher should fail on its own rather than be signaled');
    await waitFor(() => directoryWatcher.created.size > 0, 'the launcher temporary DB directory');
    assert.equal(directoryWatcher.error, null);
    assert.deepEqual(readdirSync(temporaryParent), [], 'Startup failure should remove the private DB directory');

    const response = await fetch(`${getE2EBaseURL(port)}/sentinel`, {
      signal: AbortSignal.timeout(1_000),
    });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'sentinel', 'The foreign listener must remain untouched');
  } finally {
    try {
      await stopHarness(launcher);
    } finally {
      directoryWatcher?.watcher.close();
      try {
        await closeServer(sentinel);
      } finally {
        rmSync(temporaryParent, { recursive: true, force: true });
      }
    }
  }
});
