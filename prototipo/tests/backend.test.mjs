import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createApp } from '../server/app.mjs';

function temporaryDirectory(prefix) {
  const parent = tmpdir();
  if (!statSync(parent).isDirectory()) throw new Error(`El directorio temporal no es un directorio: ${parent}`);
  return mkdtempSync(join(parent, prefix));
}

function cuitFrom(prefix = '3070999999') {
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(prefix[index]) * weight, 0);
  const remainder = sum % 11;
  const check = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  return `${prefix.slice(0, 2)}-${prefix.slice(2)}-${check}`;
}

async function harness(t, { dbPath, demoMode = true } = {}) {
  const ownsDirectory = !dbPath;
  const directory = ownsDirectory ? temporaryDirectory('jacsa-backend-') : null;
  const resolvedDbPath = dbPath ?? join(directory, 'test.sqlite');
  let app;
  let server;
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    try {
      if (server?.listening) await new Promise((resolve) => server.close(resolve));
    } finally {
      app?.locals.close();
    }
  };
  t.after(async () => {
    try {
      await close();
    } finally {
      if (ownsDirectory) rmSync(directory, { recursive: true, force: true });
    }
  });

  app = createApp({ dbPath: resolvedDbPath, demoMode });
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.once('error', reject);
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  async function call(path, { method = 'GET', body, cookie, header = true, origin } = {}) {
    const headers = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['Content-Type'] = 'application/json';
      if (header) headers['X-Jacsa-Request'] = '1';
    }
    if (cookie) headers.Cookie = cookie;
    if (origin) headers.Origin = origin;
    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const raw = await response.text();
    return { status: response.status, headers: response.headers, body: raw ? JSON.parse(raw) : null };
  }

  return { call, close, dbPath: resolvedDbPath };
}

async function login(h, username = 'rodrigo', password = 'Jacsa2026!') {
  const response = await h.call('/api/login', { method: 'POST', body: { username, password } });
  const cookie = response.headers.get('set-cookie')?.split(';', 1)[0];
  return { ...response, cookie };
}

async function manager(h) {
  const result = await login(h);
  assert.equal(result.status, 200);
  return result.cookie;
}

function changeDatabase(dbPath, sql, ...parameters) {
  const db = new DatabaseSync(dbPath);
  try {
    return db.prepare(sql).run(...parameters);
  } finally {
    db.close();
  }
}

function readDatabase(dbPath, sql, ...parameters) {
  const db = new DatabaseSync(dbPath);
  try {
    return db.prepare(sql).get(...parameters);
  } finally {
    db.close();
  }
}

function dueDate(days = 7) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function makeOrder(h, cookie, { clientId = 'CLI-ALFA', articleId = 'ART-001', quantity = 2, unit = 'gruesa' } = {}) {
  const quote = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId, articleId, quantity, unit, markupPercent: 25, validDays: 7 },
  });
  assert.equal(quote.status, 201, JSON.stringify(quote.body));
  const quoteId = quote.body.id;
  assert.equal((await h.call(`/api/quotes/${quoteId}/send`, { method: 'POST', cookie, body: {} })).status, 200);
  assert.equal((await h.call(`/api/quotes/${quoteId}/accept`, { method: 'POST', cookie, body: {} })).status, 200);
  const order = await h.call(`/api/quotes/${quoteId}/order`, {
    method: 'POST', cookie, body: { dueDate: dueDate() },
  });
  assert.equal(order.status, 200, JSON.stringify(order.body));
  return { quoteId, orderId: order.body.id };
}

async function planOrder(h, cookie, orderId, machineId = 'M-01') {
  return h.call(`/api/orders/${orderId}/plan`, {
    method: 'POST', cookie, body: { machineId, priority: 2 },
  });
}

async function receiveBlackMaterials(h, cookie) {
  const first = await h.call('/api/stock/receive', {
    method: 'POST', cookie, body: { insumoId: 'INS-NEGRO', grams: 200, memo: 'Recepción de hilado negro' },
  });
  const second = await h.call('/api/stock/receive', {
    method: 'POST', cookie, body: { insumoId: 'INS-ALMA', grams: 100, memo: 'Recepción de alma negra' },
  });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(second.status, 200, JSON.stringify(second.body));
}

test('health y catálogo público no revelan información de costos', async (t) => {
  const h = await harness(t);
  assert.deepEqual((await h.call('/api/health')).body, { ok: true });
  const catalog = await h.call('/api/catalog');
  assert.equal(catalog.status, 200);
  assert.deepEqual(catalog.body.articles.map((article) => article.id), ['ART-001', 'ART-002']);
  for (const article of catalog.body.articles) {
    assert.equal(article.public, true);
    assert.equal('costCents' in article, false);
    assert.equal('priceCents' in article, false);
    assert.equal('bom' in article, false);
  }
});

test('seed PED-DEMO-001 reserva 600/200 g blancos y mantiene intacto el stock negro', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const data = (await h.call('/api/bootstrap', { cookie })).body;
  const order = data.orders.find((item) => item.number === 'PED-DEMO-001');
  assert.equal(order.units, 200);
  assert.equal(order.quantity, 1);
  assert.equal(order.unit, '100pares');
  assert.deepEqual(order.requirements.map(({ insumoId, requiredGrams, reservedGrams }) => [
    insumoId, requiredGrams, reservedGrams,
  ]), [
    ['INS-BLANCO', 600, 600],
    ['INS-NUCLEO', 200, 200],
  ]);
  assert.equal(data.insumos.find((item) => item.id === 'INS-BLANCO').stockGrams, 1_800);
  assert.equal(data.insumos.find((item) => item.id === 'INS-BLANCO').availableGrams, 1_200);
  assert.equal(data.insumos.find((item) => item.id === 'INS-NEGRO').stockGrams, 400);
  assert.equal(data.insumos.find((item) => item.id === 'INS-ALMA').stockGrams, 200);
});

test('login crea cookie HttpOnly SameSite Strict, /me y logout conservan el contrato', async (t) => {
  const h = await harness(t);
  const result = await login(h);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.user, { id: 'usr-rodrigo', name: 'Rodrigo', username: 'rodrigo', role: 'manager' });
  const setCookie = result.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.equal('password' in result.body.user, false);
  assert.deepEqual((await h.call('/api/me', { cookie: result.cookie })).body.user, result.body.user);
  assert.deepEqual((await h.call('/api/logout', { method: 'POST', cookie: result.cookie, body: {} })).body, { ok: true });
  assert.equal((await h.call('/api/me', { cookie: result.cookie })).body.user, null);
});

test('credenciales incorrectas no revelan si existe el usuario', async (t) => {
  const h = await harness(t);
  const known = await login(h, 'rodrigo', 'incorrecta');
  const unknown = await login(h, 'inexistente', 'incorrecta');
  assert.equal(known.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(known.body, unknown.body);
});

test('mutaciones requieren cabecera de aplicación y rechazan origen externo', async (t) => {
  const h = await harness(t);
  const missing = await h.call('/api/login', { method: 'POST', header: false, body: { username: 'rodrigo', password: 'Jacsa2026!' } });
  const external = await h.call('/api/login', {
    method: 'POST', origin: 'https://evil.example', body: { username: 'rodrigo', password: 'Jacsa2026!' },
  });
  assert.equal(missing.status, 403);
  assert.equal(external.status, 403);
  assert.equal(external.body.code, 'INVALID_ORIGIN');
});

test('bootstrap exige una sesión autenticada', async (t) => {
  const h = await harness(t);
  const response = await h.call('/api/bootstrap');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'UNAUTHENTICATED');
});

test('GET /me no elimina ni renueva sesiones expiradas', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  changeDatabase(h.dbPath, "UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z'");
  const before = readDatabase(h.dbPath, 'SELECT COUNT(*) AS count FROM sessions').count;
  assert.equal((await h.call('/api/me', { cookie })).body.user, null);
  const after = readDatabase(h.dbPath, 'SELECT COUNT(*) AS count FROM sessions').count;
  assert.equal(before, 1);
  assert.equal(after, before);
});

test('clientes Alfa y Beta reciben únicamente sus registros comerciales', async (t) => {
  const h = await harness(t);
  const alfa = await login(h, 'cliente');
  const beta = await login(h, 'cliente2');
  const alfaData = (await h.call('/api/bootstrap', { cookie: alfa.cookie })).body;
  const betaData = (await h.call('/api/bootstrap', { cookie: beta.cookie })).body;
  assert.deepEqual(alfaData.clients.map((client) => client.id), ['CLI-ALFA']);
  assert.deepEqual(betaData.clients.map((client) => client.id), ['CLI-BETA']);
  assert.deepEqual(alfaData.quotes.map((quote) => quote.id), ['quote-demo-001']);
  assert.deepEqual(betaData.quotes.map((quote) => quote.id), ['quote-demo-002']);
  assert.deepEqual(alfaData.orders.map((order) => order.id), ['order-demo-001']);
  assert.deepEqual(betaData.orders.map((order) => order.id), ['order-demo-002']);
  assert.equal(alfaData.requests.length, 0);
  assert.deepEqual(alfaData.insumos, []);
});

test('cliente recibe precio público sin costos, margen ni artículo privado', async (t) => {
  const h = await harness(t);
  const cookie = (await login(h, 'cliente')).cookie;
  const data = (await h.call('/api/bootstrap', { cookie })).body;
  assert.deepEqual(data.articles.map((article) => article.id), ['ART-001', 'ART-002']);
  assert.equal(data.articles[0].priceCents, 7_500);
  assert.equal('costCents' in data.articles[0], false);
  assert.equal('markupPercent' in data.quotes[0], false);
  assert.equal('requirements' in data.orders[0], false);
  assert.equal('by' in data.orders[0].history[0], false);
});

test('operario ve producción sin precios y no puede ingresar stock', async (t) => {
  const h = await harness(t);
  const cookie = (await login(h, 'operario')).cookie;
  const data = (await h.call('/api/bootstrap', { cookie })).body;
  assert.equal(data.quotes.length, 0);
  assert.equal(data.clients.length, 0);
  assert.equal(data.orders.length, 2);
  assert.equal('clientId' in data.orders[0], false);
  assert.equal('costCents' in data.articles[0], false);
  assert.equal('priceCentsPerKg' in data.insumos[0], false);
  const denied = await h.call('/api/stock/receive', {
    method: 'POST', cookie, body: { insumoId: 'INS-NEGRO', grams: 1, memo: 'No autorizado' },
  });
  assert.equal(denied.status, 403);
  const quoteDenied = await h.call('/api/estimate', {
    method: 'POST', cookie, body: { articleId: 'ART-001', quantity: 1, unit: 'unidad' },
  });
  assert.equal(quoteDenied.status, 403);
});

test('tecnología administra usuarios pero no ve costos ni cartera comercial', async (t) => {
  const h = await harness(t);
  const cookie = (await login(h, 'sergio')).cookie;
  const data = (await h.call('/api/bootstrap', { cookie })).body;
  assert.equal(data.users.length, 6);
  assert.equal(data.clients.length, 0);
  assert.equal(data.quotes.length, 0);
  assert.equal(data.insumos.length, 0);
  assert.equal('costCents' in data.articles[0], false);
  assert.equal('passwordHash' in data.users[0], false);
  const denied = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(denied.status, 403);
});

test('estimate calcula dos gruesas de ART-001 con IVA en centavos', async (t) => {
  const h = await harness(t);
  const result = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-001', quantity: 2, unit: 'gruesa' },
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    available: true, units: 288, netCents: 2_160_000, vatCents: 453_600, totalCents: 2_613_600,
  });
});

test('conversiones unidad, gruesa y 100pares usan 1, 144 y 200 unidades', async (t) => {
  const h = await harness(t);
  const one = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-002', quantity: 1, unit: 'unidad' },
  });
  const gross = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-002', quantity: 1, unit: 'gruesa' },
  });
  const hundredPairs = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-002', quantity: 1, unit: '100pares' },
  });
  assert.equal(one.body.units, 1);
  assert.equal(gross.body.units, 144);
  assert.equal(hundredPairs.body.units, 200);
  assert.deepEqual(hundredPairs.body, {
    available: true, units: 200, netCents: 1_800_000, vatCents: 378_000, totalCents: 2_178_000,
  });
});

test('cotizar y convertir 1x100pares de ART-002 reserva BOM de 600 g y 200 g', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const quote = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-002', quantity: 1, unit: '100pares', markupPercent: 25, validDays: 7 },
  });
  assert.equal(quote.status, 201, JSON.stringify(quote.body));
  const sent = await h.call(`/api/quotes/${quote.body.id}/send`, { method: 'POST', cookie, body: {} });
  assert.equal(sent.status, 200);
  const accepted = await h.call(`/api/quotes/${quote.body.id}/accept`, { method: 'POST', cookie, body: {} });
  assert.equal(accepted.status, 200);
  const converted = await h.call(`/api/quotes/${quote.body.id}/order`, {
    method: 'POST', cookie, body: { dueDate: dueDate() },
  });
  assert.equal(converted.status, 200, JSON.stringify(converted.body));
  const order = (await h.call('/api/bootstrap', { cookie })).body.orders.find((item) => item.id === converted.body.id);
  assert.equal(order.units, 200);
  assert.deepEqual(order.requirements.map(({ insumoId, requiredGrams, reservedGrams, shortageGrams }) => [
    insumoId, requiredGrams, reservedGrams, shortageGrams,
  ]), [
    ['INS-BLANCO', 600, 600, 0],
    ['INS-NUCLEO', 200, 200, 0],
  ]);
});

test('estimación especial, sin equivalente y con precio vencido no publica importes', async (t) => {
  const h = await harness(t);
  const special = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: null, quantity: 1, unit: 'unidad', special: true },
  });
  const missing = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-INEXISTENTE', quantity: 1, unit: 'unidad' },
  });
  assert.equal(special.body.available, false);
  assert.equal(missing.body.available, false);
  assert.equal('netCents' in special.body, false);
  assert.equal('totalCents' in missing.body, false);
  changeDatabase(h.dbPath, "UPDATE insumos SET price_date = '2000-01-01' WHERE id = 'INS-NEGRO'");
  const stale = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-001', quantity: 1, unit: 'unidad' },
  });
  assert.equal(stale.body.available, false);
  assert.equal('netCents' in stale.body, false);
  const clientCookie = (await login(h, 'cliente')).cookie;
  const article = (await h.call('/api/bootstrap', { cookie: clientCookie })).body.articles[0];
  assert.equal('priceCents' in article, false);
});

test('solicitud pública valida CUIT y consentimiento antes de persistir', async (t) => {
  const h = await harness(t);
  const base = {
    articleId: 'ART-001', quantity: 1, unit: 'unidad', special: false, notes: '',
    company: 'Taller', cuit: '30-12345678-0', email: 'contacto@example.com', phone: '+54 11 1234 5678', consent: true,
  };
  const badCuit = await h.call('/api/requests', { method: 'POST', body: base });
  const noConsent = await h.call('/api/requests', {
    method: 'POST', body: { ...base, cuit: cuitFrom(), consent: false },
  });
  assert.equal(badCuit.status, 400);
  assert.equal(badCuit.body.code, 'INVALID_CUIT');
  assert.equal(noConsent.status, 400);
  assert.equal(noConsent.body.code, 'CONSENT_REQUIRED');
});

test('solicitud pública no asocia por email y rechaza marcado HTML en los datos', async (t) => {
  const h = await harness(t);
  const malicious = await h.call('/api/requests', {
    method: 'POST', body: {
      articleId: 'ART-001', quantity: 2, unit: 'unidad', special: false, notes: '<script>texto</script>',
      company: 'Empresa externa', cuit: cuitFrom(), email: 'alfa@example.com', phone: '123456789', consent: true,
    },
  });
  assert.equal(malicious.status, 400);
  const result = await h.call('/api/requests', {
    method: 'POST', body: {
      articleId: 'ART-001', quantity: 2, unit: 'unidad', special: false, notes: 'Consulta comercial',
      company: 'Empresa externa', cuit: cuitFrom(), email: 'alfa@example.com', phone: '123456789', consent: true,
    },
  });
  assert.equal(result.status, 201);
  const cookie = (await login(h)).cookie;
  const requests = (await h.call('/api/bootstrap', { cookie })).body.requests;
  const created = requests.find((request) => request.id === result.body.id);
  assert.ok(created);
  assert.equal('clientId' in created, false);
  assert.equal(created.notes, 'Consulta comercial');
  const special = await h.call('/api/requests', {
    method: 'POST', body: {
      articleId: 'CUSTOM-ARTICLE', quantity: 1, unit: 'unidad', special: true, notes: '',
      company: 'Empresa externa', cuit: cuitFrom(), email: 'custom@example.com', phone: '123456789', consent: true,
    },
  });
  assert.equal(special.status, 201);
  const specialRequest = (await h.call('/api/bootstrap', { cookie })).body.requests
    .find((request) => request.id === special.body.id);
  assert.equal(specialRequest.articleId, 'CUSTOM-ARTICLE');
});

test('solicitud desde sesión de cliente se vincula a su cuenta, nunca por email', async (t) => {
  const h = await harness(t);
  const cookie = (await login(h, 'cliente')).cookie;
  const request = await h.call('/api/requests', {
    method: 'POST', cookie, body: {
      articleId: 'ART-001', quantity: 1, unit: 'unidad', special: false, notes: '',
      company: 'Cliente Alfa', cuit: cuitFrom(), email: 'beta@example.com', phone: '123456789', consent: true,
    },
  });
  assert.equal(request.status, 201);
  const bootstrap = (await h.call('/api/bootstrap', { cookie })).body;
  assert.equal(bootstrap.requests.find((item) => item.id === request.body.id).clientId, 'CLI-ALFA');
  const betaCookie = (await login(h, 'cliente2')).cookie;
  const betaRequests = (await h.call('/api/bootstrap', { cookie: betaCookie })).body.requests;
  assert.equal(betaRequests.some((item) => item.id === request.body.id), false);
});

test('cotización conserva importes históricos aunque cambie el costo del insumo', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const created = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 2, unit: 'gruesa', markupPercent: 25, validDays: 7 },
  });
  const before = (await h.call('/api/bootstrap', { cookie })).body;
  const historical = before.quotes.find((quote) => quote.id === created.body.id);
  assert.equal(historical.netCents, 2_160_000);
  assert.equal(historical.markupPercent, 25);
  const changed = await h.call('/api/insumos/INS-NEGRO/price', {
    method: 'POST', cookie, body: { priceCentsPerKg: 2_000_000 },
  });
  assert.equal(changed.status, 200);
  const after = (await h.call('/api/bootstrap', { cookie })).body;
  const sameQuote = after.quotes.find((quote) => quote.id === created.body.id);
  assert.equal(sameQuote.netCents, historical.netCents);
  assert.equal(after.articles.find((article) => article.id === 'ART-001').costCents, 8_000);
});

test('cotización requiere confirmación explícita para usar un precio antiguo', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  changeDatabase(h.dbPath, "UPDATE insumos SET price_date = '2000-01-01' WHERE id = 'INS-NEGRO'");
  const rejected = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(rejected.status, 409);
  assert.equal(rejected.body.code, 'STALE_PRICE');
  const accepted = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7, allowStale: true },
  });
  assert.equal(accepted.status, 201);
  const quote = (await h.call('/api/bootstrap', { cookie })).body.quotes.find((item) => item.id === accepted.body.id);
  assert.equal(quote.staleAccepted, true);
});

test('cotización vencida se calcula en GET sin mutar su estado persistido', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const created = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  changeDatabase(h.dbPath, "UPDATE quotes SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?", created.body.id);
  const quote = (await h.call('/api/bootstrap', { cookie })).body.quotes.find((item) => item.id === created.body.id);
  assert.equal(quote.status, 'Vencida');
  assert.equal(readDatabase(h.dbPath, 'SELECT status FROM quotes WHERE id = ?', created.body.id).status, 'Pendiente');
  const sent = await h.call(`/api/quotes/${created.body.id}/send`, { method: 'POST', cookie, body: {} });
  assert.equal(sent.status, 409);
  assert.equal(sent.body.code, 'QUOTE_EXPIRED');
});

test('convertir cotización a pedido es idempotente y reserva parcialmente el material', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const order = await makeOrder(h, cookie);
  const repeated = await h.call(`/api/quotes/${order.quoteId}/order`, {
    method: 'POST', cookie, body: { dueDate: dueDate() },
  });
  assert.equal(repeated.status, 200);
  assert.equal(repeated.body.id, order.orderId);
  const bootstrap = (await h.call('/api/bootstrap', { cookie })).body;
  const created = bootstrap.orders.find((item) => item.id === order.orderId);
  assert.equal(created.units, 288);
  assert.deepEqual(created.requirements.map(({ insumoId, requiredGrams, reservedGrams, shortageGrams }) => [
    insumoId, requiredGrams, reservedGrams, shortageGrams,
  ]), [
    ['INS-ALMA', 288, 200, 88],
    ['INS-NEGRO', 576, 400, 176],
  ]);
  assert.equal(bootstrap.orders.filter((item) => item.quoteId === order.quoteId).length, 1);
});

test('recepción asigna automáticamente 200 g y 100 g de los faltantes más antiguos', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const { orderId } = await makeOrder(h, cookie);
  await receiveBlackMaterials(h, cookie);
  const bootstrap = (await h.call('/api/bootstrap', { cookie })).body;
  const order = bootstrap.orders.find((item) => item.id === orderId);
  assert.equal(order.requirements.find((item) => item.insumoId === 'INS-NEGRO').reservedGrams, 576);
  assert.equal(order.requirements.find((item) => item.insumoId === 'INS-NEGRO').shortageGrams, 0);
  assert.equal(order.requirements.find((item) => item.insumoId === 'INS-ALMA').reservedGrams, 288);
  assert.equal(order.requirements.find((item) => item.insumoId === 'INS-ALMA').shortageGrams, 0);
  assert.equal(bootstrap.movements.filter((movement) => movement.type === 'Ingreso').length, 2);
});

test('inicio de producción se bloquea por faltante y funciona tras la recepción', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const { orderId } = await makeOrder(h, cookie);
  assert.equal((await planOrder(h, cookie, orderId)).status, 200);
  const blocked = await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.code, 'INSUFFICIENT_STOCK');
  await receiveBlackMaterials(h, cookie);
  const started = await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} });
  assert.equal(started.status, 200);
  const operatorCookie = (await login(h, 'operario')).cookie;
  assert.equal((await h.call('/api/bootstrap', { cookie: operatorCookie })).body.orders
    .find((order) => order.id === orderId).status, 'En producción');
});

test('planificación rechaza máquinas incompatibles y máquinas ocupadas', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const incompatible = await planOrder(h, cookie, 'order-demo-002', 'M-01');
  assert.equal(incompatible.status, 409);
  assert.equal(incompatible.body.code, 'MACHINE_INCOMPATIBLE');
  assert.equal((await h.call('/api/orders/order-demo-001/start', { method: 'POST', cookie, body: {} })).status, 200);
  const { orderId } = await makeOrder(h, cookie);
  const busy = await planOrder(h, cookie, orderId, 'M-09');
  assert.equal(busy.status, 409);
  assert.equal(busy.body.code, 'MACHINE_BUSY');
});

test('producción incremental consume reserva una sola vez y el control de calidad marca Listo', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const { orderId } = await makeOrder(h, cookie);
  await planOrder(h, cookie, orderId);
  await receiveBlackMaterials(h, cookie);
  assert.equal((await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} })).status, 200);
  const first = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 100, qualityChecked: false },
  });
  assert.equal(first.status, 200);
  const bootstrap = (await h.call('/api/bootstrap', { cookie })).body;
  const order = bootstrap.orders.find((item) => item.id === orderId);
  assert.equal(order.requirements.find((item) => item.insumoId === 'INS-NEGRO').consumedGrams, 200);
  assert.equal(order.requirements.find((item) => item.insumoId === 'INS-NEGRO').reservedGrams, 376);
  const repeats = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 100, qualityChecked: false },
  });
  assert.equal(repeats.status, 200);
  const movements = (await h.call('/api/bootstrap', { cookie })).body.movements
    .filter((item) => item.orderId === orderId && item.type === 'Consumo');
  assert.equal(movements.length, 2);
  assert.equal(movements.find((item) => item.insumoId === 'INS-NEGRO').grams, 200);
  const completed = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 288, qualityChecked: false },
  });
  assert.equal(completed.status, 200);
  const ready = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 288, qualityChecked: true },
  });
  assert.equal(ready.status, 200);
  const finalOrder = (await h.call('/api/bootstrap', { cookie })).body.orders.find((item) => item.id === orderId);
  assert.equal(finalOrder.status, 'Listo');
  assert.equal(finalOrder.qualityChecked, true);
  assert.equal(finalOrder.requirements.find((item) => item.insumoId === 'INS-NEGRO').consumedGrams, 576);
});

test('avance rechaza decrementos, sobreproducción y calidad incompleta', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const { orderId } = await makeOrder(h, cookie);
  await planOrder(h, cookie, orderId);
  await receiveBlackMaterials(h, cookie);
  await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} });
  const incomplete = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 10, qualityChecked: true },
  });
  assert.equal(incomplete.status, 400);
  assert.equal(incomplete.body.code, 'QUALITY_INCOMPLETE');
  await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 10, qualityChecked: false },
  });
  const decreased = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 9, qualityChecked: false },
  });
  const excess = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 289, qualityChecked: false },
  });
  assert.equal(decreased.status, 400);
  assert.equal(decreased.body.code, 'PRODUCTION_DECREASE');
  assert.equal(excess.status, 400);
  assert.equal(excess.body.code, 'OVERPRODUCTION');
});

test('pedido Listo solo recorre la transición siguiente de estado', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const { orderId, quoteId } = await makeOrder(h, cookie);
  await planOrder(h, cookie, orderId);
  await receiveBlackMaterials(h, cookie);
  await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} });
  await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 288, qualityChecked: true },
  });
  const skip = await h.call(`/api/orders/${orderId}/state`, {
    method: 'POST', cookie, body: { status: 'Cobrado' },
  });
  assert.equal(skip.status, 409);
  assert.equal(skip.body.code, 'INVALID_STATE_TRANSITION');
  const beforeDelivery = (await h.call('/api/bootstrap', { cookie })).body.notifications
    .filter((item) => item.orderId === orderId);
  assert.deepEqual(beforeDelivery.map((item) => item.event).sort(), ['En producción', 'Listo']);
  assert.equal((await h.call(`/api/orders/${orderId}/state`, { method: 'POST', cookie, body: { status: 'Entregado' } })).status, 200);
  assert.equal((await h.call(`/api/orders/${orderId}/state`, { method: 'POST', cookie, body: { status: 'Pendiente de cobro' } })).status, 200);
  assert.equal((await h.call(`/api/orders/${orderId}/state`, { method: 'POST', cookie, body: { status: 'Cobrado' } })).status, 200);

  const managerData = (await h.call('/api/bootstrap', { cookie })).body;
  const order = managerData.orders.find((item) => item.id === orderId);
  const orderEvents = managerData.notifications.filter((item) => item.orderId === orderId);
  assert.deepEqual(orderEvents.map((item) => item.event).sort(), ['En producción', 'Entregado', 'Listo']);
  assert.equal(managerData.notifications.filter((item) => item.quoteId === quoteId).length, 1);
  for (const notification of orderEvents) {
    assert.equal(notification.clientId, 'CLI-ALFA');
    assert.equal(notification.recipient, 'alfa@example.com');
    assert.equal(notification.channel, 'Email');
    assert.equal(notification.status, 'Registrada');
    for (const value of [order.number, 'ART-001', 'Cordón industrial', notification.event, order.dueDate]) {
      assert.ok(notification.subject.includes(value));
      assert.ok(notification.body.includes(value));
    }
  }
  assert.equal(orderEvents.some((item) => ['Pendiente de cobro', 'Cobrado'].includes(item.event)), false);

  const clientCookie = (await login(h, 'cliente')).cookie;
  const clientNotifications = (await h.call('/api/bootstrap', { cookie: clientCookie })).body.notifications;
  assert.deepEqual(clientNotifications.map((item) => item.event).sort(), [
    'Cotización enviada', 'En producción', 'Entregado', 'Listo',
  ]);
  const otherClientCookie = (await login(h, 'cliente2')).cookie;
  const otherClientNotifications = (await h.call('/api/bootstrap', { cookie: otherClientCookie })).body.notifications;
  assert.equal(otherClientNotifications.some((item) => item.orderId === orderId), false);

  const productionNotice = orderEvents.find((item) => item.event === 'En producción');
  changeDatabase(h.dbPath, "UPDATE notifications SET status = 'Pendiente de reintento' WHERE id = ?", productionNotice.id);
  assert.equal((await h.call(`/api/notifications/${productionNotice.id}/retry`, { method: 'POST', cookie, body: {} })).status, 200);
  assert.equal((await h.call(`/api/notifications/${productionNotice.id}/retry`, { method: 'POST', cookie, body: {} })).status, 409);
  const afterRetry = (await h.call('/api/bootstrap', { cookie })).body.notifications.filter((item) => item.orderId === orderId);
  assert.equal(afterRetry.length, 3);
});

test('sin email de contacto el aviso queda pendiente y el cambio de estado se confirma', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const { orderId } = await makeOrder(h, cookie);
  changeDatabase(h.dbPath, "UPDATE clients SET email = '' WHERE id = 'CLI-ALFA'");
  await planOrder(h, cookie, orderId);
  await receiveBlackMaterials(h, cookie);
  const started = await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} });
  assert.equal(started.status, 200);
  const data = (await h.call('/api/bootstrap', { cookie })).body;
  assert.equal(data.orders.find((item) => item.id === orderId).status, 'En producción');
  const notification = data.notifications.find((item) => item.orderId === orderId && item.event === 'En producción');
  assert.ok(notification);
  assert.equal(notification.recipient, '');
  assert.equal(notification.status, 'Pendiente de reintento');
});

test('cambio de fecha exige motivo y reintento actualiza el mismo evento outbox', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const { orderId } = await makeOrder(h, cookie);
  const noReason = await h.call(`/api/orders/${orderId}/date`, {
    method: 'POST', cookie, body: { dueDate: dueDate(10), memo: '' },
  });
  assert.equal(noReason.status, 400);
  const changed = await h.call(`/api/orders/${orderId}/date`, {
    method: 'POST', cookie, body: { dueDate: dueDate(10), memo: 'Cambio coordinado con cliente' },
  });
  assert.equal(changed.status, 200);
  const notification = (await h.call('/api/bootstrap', { cookie })).body.notifications
    .find((item) => item.orderId === orderId);
  assert.ok(notification);
  assert.equal(notification.status, 'Registrada');
  assert.equal((await h.call(`/api/notifications/${notification.id}/retry`, { method: 'POST', cookie, body: {} })).status, 409);
  changeDatabase(h.dbPath, "UPDATE notifications SET status = 'Pendiente de reintento' WHERE id = ?", notification.id);
  assert.equal((await h.call(`/api/notifications/${notification.id}/retry`, { method: 'POST', cookie, body: {} })).status, 200);
  const after = (await h.call('/api/bootstrap', { cookie })).body.notifications.filter((item) => item.orderId === orderId);
  assert.equal(after.length, 1);
  assert.equal(after[0].status, 'Registrada');
});

test('tecnología deshabilita una cuenta e invalida sus sesiones y no se auto-deshabilita', async (t) => {
  const h = await harness(t);
  const techCookie = (await login(h, 'sergio')).cookie;
  const operatorCookie = (await login(h, 'operario')).cookie;
  const self = await h.call('/api/users/usr-sergio/enabled', {
    method: 'POST', cookie: techCookie, body: { enabled: false },
  });
  assert.equal(self.status, 400);
  const disabled = await h.call('/api/users/usr-operario/enabled', {
    method: 'POST', cookie: techCookie, body: { enabled: false },
  });
  assert.equal(disabled.status, 200);
  assert.equal((await h.call('/api/me', { cookie: operatorCookie })).body.user, null);
  assert.equal((await login(h, 'operario')).status, 401);
});

test('reset solo opera con modo demo y confirmación, preserva sesión y restablece datos demo', async (t) => {
  const disabled = await harness(t, { demoMode: false });
  const disabledCookie = await manager(disabled);
  const denied = await disabled.call('/api/demo/reset', {
    method: 'POST', cookie: disabledCookie, body: { confirmation: 'REINICIAR DEMO' },
  });
  assert.equal(denied.status, 403);
  const h = await harness(t, { demoMode: true });
  const cookie = await manager(h);
  const wrong = await h.call('/api/demo/reset', { method: 'POST', cookie, body: { confirmation: 'SI' } });
  assert.equal(wrong.status, 400);
  changeDatabase(h.dbPath, "UPDATE users SET is_demo = 0 WHERE id = 'usr-cliente2'");
  const mixedData = await h.call('/api/demo/reset', {
    method: 'POST', cookie, body: { confirmation: 'REINICIAR DEMO' },
  });
  assert.equal(mixedData.status, 403);
  assert.equal(mixedData.body.code, 'NON_DEMO_DATA');
  changeDatabase(h.dbPath, "UPDATE users SET is_demo = 1 WHERE id = 'usr-cliente2'");
  const reset = await h.call('/api/demo/reset', {
    method: 'POST', cookie, body: { confirmation: 'REINICIAR DEMO' },
  });
  assert.deepEqual(reset.body, { ok: true });
  assert.equal((await h.call('/api/me', { cookie })).body.user.id, 'usr-rodrigo');
  const bootstrap = (await h.call('/api/bootstrap', { cookie })).body;
  assert.equal(bootstrap.orders.length, 2);
  assert.equal(bootstrap.requests.length, 0);
  assert.equal(bootstrap.insumos.find((item) => item.id === 'INS-NEGRO').stockGrams, 400);
});

test('SQLite y sesión sobreviven al cierre y reapertura de la aplicación', async (t) => {
  const directory = temporaryDirectory('jacsa-persistence-');
  const dbPath = join(directory, 'persistent.sqlite');
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const first = await harness(t, { dbPath });
  const cookie = await manager(first);
  const receive = await first.call('/api/stock/receive', {
    method: 'POST', cookie, body: { insumoId: 'INS-NEGRO', grams: 77, memo: 'Persistencia' },
  });
  assert.equal(receive.status, 200);
  await first.close();
  const second = await harness(t, { dbPath });
  assert.equal((await second.call('/api/me', { cookie })).body.user.id, 'usr-rodrigo');
  const stock = (await second.call('/api/bootstrap', { cookie })).body.insumos.find((item) => item.id === 'INS-NEGRO');
  assert.equal(stock.stockGrams, 477);
  assert.equal((await second.call('/api/bootstrap', { cookie })).body.orders.length, 2);
});
