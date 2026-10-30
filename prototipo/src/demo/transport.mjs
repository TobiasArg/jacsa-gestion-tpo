import { createEngine } from './engine.mjs';

let engine;

function browserEngine() {
  if (engine) return engine;
  const storage = {
    get(key) {
      return window.localStorage.getItem(key);
    },
    set(key, value) {
      window.localStorage.setItem(key, value);
    },
    remove(key) {
      window.localStorage.removeItem(key);
    },
  };
  const session = {
    get(key) {
      return window.sessionStorage.getItem(key);
    },
    set(key, value) {
      window.sessionStorage.setItem(key, value);
    },
    remove(key) {
      window.sessionStorage.removeItem(key);
    },
  };
  const runExclusive = (operation) => {
    const locks = globalThis.navigator?.locks;
    if (locks?.request) return locks.request('jacsa-demo:v1', operation);
    return operation();
  };
  engine = createEngine({ storage, session, clock: { now: () => new Date() }, runExclusive });
  return engine;
}

export function demoRequest(path, method, body) {
  return browserEngine().handle(path, method, body);
}
