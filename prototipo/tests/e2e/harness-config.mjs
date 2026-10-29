const DEFAULT_E2E_PORT = 3181;

export function getE2EPort(value = process.env.JACSA_E2E_PORT) {
  const configuredPort = value ?? String(DEFAULT_E2E_PORT);
  if (!/^\d+$/.test(configuredPort) || configuredPort.trim() !== configuredPort) {
    throw new Error('JACSA_E2E_PORT debe ser un entero entre 1 y 65535.');
  }

  const port = Number(configuredPort);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('JACSA_E2E_PORT debe ser un entero entre 1 y 65535.');
  }

  return port;
}

export function getE2EBaseURL(port = getE2EPort()) {
  return `http://127.0.0.1:${port}`;
}
