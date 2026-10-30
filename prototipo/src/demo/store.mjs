export const BUSINESS_KEY = 'jacsa-demo:v1';
export const SESSION_KEY = 'jacsa-demo:session';
export const STORAGE_VERSION = 1;

export class DemoError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'DemoError';
    this.status = status;
    this.code = code;
  }
}

function storageError(error, action) {
  const quota = error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014;
  if (quota) return new DemoError(507, 'STORAGE_QUOTA', 'El almacenamiento de la demo está lleno; no se guardaron los cambios. Libera espacio o reinicia la demo explícitamente.');
  return new DemoError(503, 'STORAGE_UNAVAILABLE', `No se pudo ${action} el almacenamiento local de la demo.`);
}

export function readEnvelope(storage, makeSeed, now) {
  let raw;
  try {
    raw = storage.get(BUSINESS_KEY);
  } catch (error) {
    throw storageError(error, 'leer');
  }
  if (raw === null) {
    const initial = { version: STORAGE_VERSION, seededAt: now.toISOString(), data: makeSeed() };
    writeEnvelope(storage, initial);
    return initial;
  }
  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    throw new DemoError(409, 'STORAGE_CORRUPT', 'Los datos guardados de la demo están dañados. Reinicia la demo con confirmación para restaurar los datos de ejemplo.');
  }
  const requiredCollections = ['users', 'clients', 'articles', 'insumos', 'machines', 'requests', 'quotes', 'orders', 'notifications', 'movements'];
  const validData = envelope?.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    && requiredCollections.every((collection) => Array.isArray(envelope.data[collection]))
    && envelope.data.settings && typeof envelope.data.settings === 'object' && !Array.isArray(envelope.data.settings);
  if (!envelope || envelope.version !== STORAGE_VERSION || typeof envelope.seededAt !== 'string' || !validData) {
    throw new DemoError(409, 'STORAGE_CORRUPT', 'La versión o estructura de los datos guardados no es compatible. Reinicia la demo con confirmación para restaurar los datos de ejemplo.');
  }
  return envelope;
}

export function writeEnvelope(storage, envelope) {
  try {
    storage.set(BUSINESS_KEY, JSON.stringify(envelope));
  } catch (error) {
    throw storageError(error, 'guardar');
  }
}

export function readSession(session) {
  let raw;
  try {
    raw = session.get(SESSION_KEY);
  } catch (error) {
    throw storageError(error, 'leer la sesión de');
  }
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw);
    if (typeof value?.userId !== 'string') return null;
    const sessionEpoch = Number.isSafeInteger(value.sessionEpoch) && value.sessionEpoch >= 0 ? value.sessionEpoch : 0;
    return { userId: value.userId, sessionEpoch };
  } catch {
    return null;
  }
}

export function readSessionUserId(session) {
  return readSession(session)?.userId ?? null;
}

export function writeSession(session, userId, sessionEpoch = 0) {
  try {
    session.set(SESSION_KEY, JSON.stringify({ userId, sessionEpoch }));
  } catch (error) {
    throw storageError(error, 'guardar la sesión en');
  }
}

export function removeSession(session) {
  try {
    session.remove(SESSION_KEY);
  } catch (error) {
    throw storageError(error, 'cerrar la sesión en');
  }
}
