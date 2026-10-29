import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApp } from './app.mjs';

export { createApp } from './app.mjs';

function start() {
  const app = createApp({ demoMode: process.env.JACSA_DEMO === '1' });
  const host = process.env.APP_HOST ?? '127.0.0.1';
  const port = Number(process.env.API_PORT ?? 3001);
  const server = app.listen(port, host, () => {
    console.log(`JACSA API disponible en http://${host}:${port}`);
  });
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    server.close(() => {
      app.locals.close();
    });
  };
  server.on('error', () => {
    app.locals.close();
    process.exitCode = 1;
  });
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) start();
