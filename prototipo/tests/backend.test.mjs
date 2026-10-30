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

  async function call(path, { method = 'GET', body, rawBody, contentType = 'application/json', cookie, header = true, origin } = {}) {
    const headers = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['Content-Type'] = contentType;
      if (header) headers['X-Jacsa-Request'] = '1';
    }
    if (cookie) headers.Cookie = cookie;
    if (origin) headers.Origin = origin;
    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      ...(rawBody !== undefined ? { body: rawBody } : body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const raw = await response.text();
    const isJson = response.headers.get('content-type')?.includes('application/json');
    return { status: response.status, headers: response.headers, body: raw ? (isJson ? JSON.parse(raw) : raw) : null };
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

test('el cliente no ve borradores ni cotizaciones Pendiente vencidas; las recibe al enviarlas', async (t) => {
  const h = await harness(t);
  const managerCookie = await manager(h);
  const created = await h.call('/api/quotes', {
    method: 'POST', cookie: managerCookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(created.status, 201);

  changeDatabase(h.dbPath, "UPDATE quotes SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?", created.body.id);
  const alfaCookie = (await login(h, 'cliente')).cookie;
  const beforeSend = (await h.call('/api/bootstrap', { cookie: alfaCookie })).body;
  assert.equal(beforeSend.quotes.some((quote) => quote.id === created.body.id), false);

  changeDatabase(h.dbPath, "UPDATE quotes SET expires_at = '2099-01-01T00:00:00.000Z' WHERE id = ?", created.body.id);
  assert.equal((await h.call(`/api/quotes/${created.body.id}/send`, {
    method: 'POST', cookie: managerCookie, body: {},
  })).status, 200);
  const afterSend = (await h.call('/api/bootstrap', { cookie: alfaCookie })).body;
  assert.equal(afterSend.quotes.find((quote) => quote.id === created.body.id).status, 'Enviada');

  const betaCookie = (await login(h, 'cliente2')).cookie;
  const betaData = (await h.call('/api/bootstrap', { cookie: betaCookie })).body;
  assert.equal(betaData.quotes.some((quote) => quote.id === created.body.id), false);
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

test('solicitud pública valida CUIT/consentimiento y no asocia una sesión staff por email/CUIT', async (t) => {
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

  const authenticatedRoles = {
    manager: await manager(h),
    admin: (await login(h, 'lorena')).cookie,
    operator: (await login(h, 'operario')).cookie,
    technology: (await login(h, 'sergio')).cookie,
  };
  const roleResponses = await Promise.all(Object.entries(authenticatedRoles).map(async ([role, cookie]) => {
    const response = await h.call('/api/requests', {
      method: 'POST', cookie, body: { ...base, cuit: '30709999997', email: 'alfa@example.com', consent: true },
    });
    return { role, status: response.status, code: response.body.code ?? null, id: response.body.id };
  }));
  assert.deepEqual(roleResponses.map(({ role, status, code }) => [role, status, code]),
    Object.keys(authenticatedRoles).map((role) => [role, 201, null]));
  for (const { role, id } of roleResponses) {
    assert.equal(typeof id, 'string', `${role} recibe una solicitud creada`);
    assert.equal(readDatabase(h.dbPath, 'SELECT client_id FROM requests WHERE id = ?', id).client_id, null,
      `${role}: email/CUIT de Alfa no asocian una sesión staff a CLI-ALFA`);
  }
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

test('cotizar una solicitud anónima la vincula al cliente elegido y la hace visible solo para él', async (t) => {
  const h = await harness(t);
  const request = await h.call('/api/requests', {
    method: 'POST', body: {
      articleId: 'ART-001', quantity: 1, unit: 'unidad', special: false, notes: '',
      company: 'Cliente potencial', cuit: cuitFrom(), email: 'alfa@example.com', phone: '123456789', consent: true,
    },
  });
  assert.equal(request.status, 201);
  assert.equal(readDatabase(h.dbPath, 'SELECT client_id FROM requests WHERE id = ?', request.body.id).client_id, null);

  const managerCookie = await manager(h);
  const created = await h.call('/api/quotes', {
    method: 'POST', cookie: managerCookie,
    body: {
      clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7,
      requestId: request.body.id,
    },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const linkedRequest = readDatabase(h.dbPath, 'SELECT client_id, status FROM requests WHERE id = ?', request.body.id);
  assert.equal(linkedRequest.client_id, 'CLI-ALFA');
  assert.equal(linkedRequest.status, 'Cotizada');

  const alfaCookie = (await login(h, 'cliente')).cookie;
  const alfaRequests = (await h.call('/api/bootstrap', { cookie: alfaCookie })).body.requests;
  assert.equal(alfaRequests.some((item) => item.id === request.body.id), true);
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

  const sentQuote = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(sentQuote.status, 201);
  assert.equal((await h.call(`/api/quotes/${sentQuote.body.id}/send`, { method: 'POST', cookie, body: {} })).status, 200);
  changeDatabase(h.dbPath, "UPDATE quotes SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?", sentQuote.body.id);
  const expiredAccept = await h.call(`/api/quotes/${sentQuote.body.id}/accept`, { method: 'POST', cookie, body: {} });
  assert.equal(expiredAccept.status, 409);
  assert.equal(expiredAccept.body.code, 'QUOTE_EXPIRED');

  const acceptedQuote = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(acceptedQuote.status, 201);
  assert.equal((await h.call(`/api/quotes/${acceptedQuote.body.id}/send`, { method: 'POST', cookie, body: {} })).status, 200);
  assert.equal((await h.call(`/api/quotes/${acceptedQuote.body.id}/accept`, { method: 'POST', cookie, body: {} })).status, 200);
  changeDatabase(h.dbPath, "UPDATE quotes SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?", acceptedQuote.body.id);
  const expiredOrder = await h.call(`/api/quotes/${acceptedQuote.body.id}/order`, {
    method: 'POST', cookie, body: { dueDate: dueDate() },
  });
  assert.equal(expiredOrder.status, 409);
  assert.equal(expiredOrder.body.code, 'QUOTE_EXPIRED');
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

test('planificación rechaza incompatibilidad, permite encolar ocupado y conserva el bloqueo de inicio', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const incompatible = await planOrder(h, cookie, 'order-demo-002', 'M-01');
  assert.equal(incompatible.status, 409);
  assert.equal(incompatible.body.code, 'MACHINE_INCOMPATIBLE');
  const firstStarted = await h.call('/api/orders/order-demo-001/start', { method: 'POST', cookie, body: {} });
  assert.equal(firstStarted.status, 200);
  const { orderId } = await makeOrder(h, cookie);
  await receiveBlackMaterials(h, cookie);
  const queued = await planOrder(h, cookie, orderId, 'M-09');
  assert.equal(queued.status, 200);
  const blocked = await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.code, 'MACHINE_BUSY');

  const firstReady = await h.call('/api/orders/order-demo-001/progress', {
    method: 'POST', cookie, body: { producedUnits: 200, qualityChecked: true },
  });
  assert.equal(firstReady.status, 200, JSON.stringify(firstReady.body));
  assert.equal((await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} })).status, 200);
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

test('belowMinimum usa el stock físico e indica bajo mínimo solo tras consumir', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const initial = (await h.call('/api/bootstrap', { cookie })).body;
  for (const id of ['INS-NEGRO', 'INS-ALMA']) {
    assert.equal(initial.insumos.find((item) => item.id === id).belowMinimum, false);
  }

  const { orderId } = await makeOrder(h, cookie);
  await planOrder(h, cookie, orderId);
  await receiveBlackMaterials(h, cookie);
  assert.equal((await h.call(`/api/orders/${orderId}/start`, { method: 'POST', cookie, body: {} })).status, 200);
  const produced = await h.call(`/api/orders/${orderId}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 288, qualityChecked: true },
  });
  assert.equal(produced.status, 200);

  const after = (await h.call('/api/bootstrap', { cookie })).body;
  assert.deepEqual(['INS-NEGRO', 'INS-ALMA'].map((id) => {
    const item = after.insumos.find((insumo) => insumo.id === id);
    return [item.stockGrams, item.minGrams, item.belowMinimum];
  }), [[24, 100, true], [12, 50, true]]);
  const operatorCookie = (await login(h, 'operario')).cookie;
  const operatorInsumos = (await h.call('/api/bootstrap', { cookie: operatorCookie })).body.insumos;
  assert.equal(operatorInsumos.find((item) => item.id === 'INS-NEGRO').belowMinimum, true);
  assert.equal(operatorInsumos.find((item) => item.id === 'INS-ALMA').belowMinimum, true);
});

test('delayed se calcula por fecha UTC y estado para staff, no se expone al cliente', async (t) => {
  const h = await harness(t);
  const managerCookie = await manager(h);
  const orderId = 'order-demo-001';
  const before = (await h.call('/api/bootstrap', { cookie: managerCookie })).body.orders
    .find((order) => order.id === orderId);
  assert.equal(before.delayed, false);

  changeDatabase(h.dbPath, 'UPDATE orders SET due_date = ? WHERE id = ?', dueDate(-1), orderId);
  const delayedManagerOrder = (await h.call('/api/bootstrap', { cookie: managerCookie })).body.orders
    .find((order) => order.id === orderId);
  assert.equal(delayedManagerOrder.delayed, true);
  const operatorCookie = (await login(h, 'operario')).cookie;
  const delayedOperatorOrder = (await h.call('/api/bootstrap', { cookie: operatorCookie })).body.orders
    .find((order) => order.id === orderId);
  assert.equal(delayedOperatorOrder.delayed, true);
  const clientCookie = (await login(h, 'cliente')).cookie;
  const clientOrder = (await h.call('/api/bootstrap', { cookie: clientCookie })).body.orders
    .find((order) => order.id === orderId);
  assert.equal('delayed' in clientOrder, false);

  changeDatabase(h.dbPath, "UPDATE orders SET status = 'Entregado' WHERE id = ?", orderId);
  const delivered = (await h.call('/api/bootstrap', { cookie: managerCookie })).body.orders
    .find((order) => order.id === orderId);
  assert.equal(delivered.delayed, false);
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

test('cotización enviada y cambio de fecha se confirman con destinatario vacío, dejando avisos pendientes', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const quote = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(quote.status, 201);
  changeDatabase(h.dbPath, "UPDATE clients SET email = '   ' WHERE id = 'CLI-ALFA'");

  const sent = await h.call(`/api/quotes/${quote.body.id}/send`, { method: 'POST', cookie, body: {} });
  assert.equal(sent.status, 200);
  const quoteData = (await h.call('/api/bootstrap', { cookie })).body;
  assert.equal(quoteData.quotes.find((item) => item.id === quote.body.id).status, 'Enviada');
  const quoteNotice = quoteData.notifications.find((item) => item.quoteId === quote.body.id);
  assert.equal(quoteNotice.recipient, '');
  assert.equal(quoteNotice.status, 'Pendiente de reintento');

  assert.equal((await h.call(`/api/quotes/${quote.body.id}/accept`, { method: 'POST', cookie, body: {} })).status, 200);
  const order = await h.call(`/api/quotes/${quote.body.id}/order`, {
    method: 'POST', cookie, body: { dueDate: dueDate() },
  });
  assert.equal(order.status, 200);
  const nextDueDate = dueDate(10);
  const changed = await h.call(`/api/orders/${order.body.id}/date`, {
    method: 'POST', cookie, body: { dueDate: nextDueDate, memo: 'Reprogramación acordada' },
  });
  assert.equal(changed.status, 200);
  const updated = (await h.call('/api/bootstrap', { cookie })).body;
  assert.equal(updated.orders.find((item) => item.id === order.body.id).dueDate, nextDueDate);
  const dateNotice = updated.notifications.find((item) => item.orderId === order.body.id);
  assert.equal(dateNotice.recipient, '');
  assert.equal(dateNotice.status, 'Pendiente de reintento');
});

test('reintentar sin contacto no altera el aviso y registra el mismo evento al restaurar el email', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  changeDatabase(h.dbPath, "UPDATE clients SET email = '' WHERE id = 'CLI-ALFA'");
  const quote = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(quote.status, 201);
  assert.equal((await h.call(`/api/quotes/${quote.body.id}/send`, { method: 'POST', cookie, body: {} })).status, 200);
  const notice = (await h.call('/api/bootstrap', { cookie })).body.notifications
    .find((item) => item.quoteId === quote.body.id);
  const before = readDatabase(h.dbPath,
    'SELECT recipient, status, retry_count FROM notifications WHERE id = ?', notice.id);
  const missing = await h.call(`/api/notifications/${notice.id}/retry`, { method: 'POST', cookie, body: {} });
  assert.equal(missing.status, 409);
  assert.equal(missing.body.code, 'NOTIFICATION_RECIPIENT_MISSING');
  assert.deepEqual(readDatabase(h.dbPath,
    'SELECT recipient, status, retry_count FROM notifications WHERE id = ?', notice.id), before);

  changeDatabase(h.dbPath, "UPDATE clients SET email = '  reintento@example.com  ' WHERE id = 'CLI-ALFA'");
  const retried = await h.call(`/api/notifications/${notice.id}/retry`, { method: 'POST', cookie, body: {} });
  assert.equal(retried.status, 200);
  assert.deepEqual({ ...readDatabase(h.dbPath,
    'SELECT recipient, status, retry_count FROM notifications WHERE id = ?', notice.id) }, {
    recipient: 'reintento@example.com', status: 'Registrada', retry_count: 1,
  });
  assert.equal(readDatabase(h.dbPath, 'SELECT COUNT(*) AS count FROM notifications WHERE quote_id = ?', quote.body.id).count, 1);
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
  const separateDatabase = (await disabled.call('/api/bootstrap', { cookie: disabledCookie })).body;
  assert.equal(separateDatabase.insumos.find((item) => item.id === 'INS-NEGRO').stockGrams, 400);
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

test('E06 y E08-E22: roles permitidos alcanzan el handler y los no permitidos reciben 403', async (t) => {
  const h = await harness(t);
  const cookies = {
    manager: await manager(h),
    admin: (await login(h, 'lorena')).cookie,
    operator: (await login(h, 'operario')).cookie,
    technology: (await login(h, 'sergio')).cookie,
    client: (await login(h, 'cliente')).cookie,
  };
  const cases = [
    {
      id: 'E09', allowed: ['manager'], path: '/api/quotes',
      body: { clientId: 'CLI-QA-MISSING', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
      status: 404, code: 'CLIENT_NOT_FOUND',
    },
    {
      id: 'E10', allowed: ['manager'], path: '/api/quotes/quote-qa-missing/send',
      body: {}, status: 404, code: 'QUOTE_NOT_FOUND',
    },
    {
      id: 'E11', allowed: ['manager'], path: '/api/quotes/quote-qa-missing/accept',
      body: {}, status: 404, code: 'QUOTE_NOT_FOUND',
    },
    {
      id: 'E12', allowed: ['manager'], path: '/api/quotes/quote-qa-missing/order',
      body: { dueDate: dueDate() }, status: 404, code: 'QUOTE_NOT_FOUND',
    },
    {
      id: 'E13', allowed: ['manager', 'admin'], path: '/api/stock/receive',
      body: { insumoId: 'INS-QA-MISSING', grams: 1, memo: 'Prueba de permisos' },
      status: 404, code: 'INSUMO_NOT_FOUND',
    },
    {
      id: 'E14', allowed: ['manager', 'admin'], path: '/api/insumos/INS-QA-MISSING/price',
      body: { priceCentsPerKg: 1 }, status: 404, code: 'INSUMO_NOT_FOUND',
    },
    {
      id: 'E15', allowed: ['manager'], path: '/api/orders/order-qa-missing/plan',
      body: { machineId: 'M-01', priority: 1 }, status: 404, code: 'ORDER_NOT_FOUND',
    },
    {
      id: 'E16', allowed: ['operator', 'manager'], path: '/api/orders/order-qa-missing/start',
      body: {}, status: 404, code: 'ORDER_NOT_FOUND',
    },
    {
      id: 'E17', allowed: ['operator', 'manager'], path: '/api/orders/order-qa-missing/progress',
      body: { producedUnits: 0, qualityChecked: false }, status: 404, code: 'ORDER_NOT_FOUND',
    },
    {
      id: 'E18', allowed: ['manager', 'admin'], path: '/api/orders/order-qa-missing/state',
      body: { status: 'Entregado' }, status: 404, code: 'ORDER_NOT_FOUND',
    },
    {
      id: 'E19', allowed: ['manager'], path: '/api/orders/order-qa-missing/date',
      body: { dueDate: dueDate(), memo: 'Prueba de permisos' }, status: 404, code: 'ORDER_NOT_FOUND',
    },
    {
      id: 'E20', allowed: ['manager', 'admin'],
      path: '/api/notifications/notification-qa-missing/retry',
      body: {}, status: 404, code: 'NOTIFICATION_NOT_FOUND',
    },
    {
      id: 'E21', allowed: ['manager', 'technology'], path: '/api/demo/reset',
      body: { confirmation: 'NO REINICIAR' }, status: 400, code: 'CONFIRMATION_REQUIRED',
    },
    {
      id: 'E22', allowed: ['technology'], path: '/api/users/usr-qa-missing/enabled',
      body: { enabled: true }, status: 404, code: 'USER_NOT_FOUND',
    },
  ];

  for (const role of Object.keys(cookies)) {
    const bootstrap = await h.call('/api/bootstrap', { cookie: cookies[role] });
    assert.equal(bootstrap.status, 200, `E08 para rol ${role}`);
  }
  assert.equal((await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-001', quantity: 1, unit: 'unidad' },
  })).status, 200, 'E06 permite consulta pública');
  for (const role of ['manager', 'admin', 'client']) {
    const estimate = await h.call('/api/estimate', {
      method: 'POST', cookie: cookies[role], body: { articleId: 'ART-001', quantity: 1, unit: 'unidad' },
    });
    assert.equal(estimate.status, 200, `E06 debe permitir ${role}`);
  }
  for (const role of ['operator', 'technology']) {
    const estimate = await h.call('/api/estimate', {
      method: 'POST', cookie: cookies[role], body: { articleId: 'ART-001', quantity: 1, unit: 'unidad' },
    });
    assert.equal(estimate.status, 403, `E06 debe restringir ${role}`);
    assert.equal(estimate.body.code, 'FORBIDDEN');
  }
  for (const operation of cases) {
    for (const role of operation.allowed) {
      const response = await h.call(operation.path, {
        method: 'POST', cookie: cookies[role], body: operation.body,
      });
      assert.equal(response.status, operation.status, `${operation.id}: ${role} debe llegar a la regla de negocio: ${JSON.stringify(response.body)}`);
      assert.equal(response.body.code, operation.code, `${operation.id}: resultado de negocio para ${role}`);
    }
    for (const role of Object.keys(cookies).filter((candidate) => !operation.allowed.includes(candidate))) {
      const denied = await h.call(operation.path, {
        method: 'POST', cookie: cookies[role], body: operation.body,
      });
      assert.equal(denied.status, 403, `${operation.id}: ${role} debe ser rechazado`);
      assert.equal(denied.body.code, 'FORBIDDEN', `${operation.id}: rechazo de rol`);
    }
    const unauthenticated = await h.call(operation.path, { method: 'POST', body: operation.body });
    assert.equal(unauthenticated.status, 401, `${operation.id}: sin sesión debe ser rechazado`);
    assert.equal(unauthenticated.body.code, 'UNAUTHENTICATED', `${operation.id}: rechazo sin sesión`);
  }
});

test('transporte JSON rechaza tipo, sintaxis y tamaño inválidos; rutas desconocidas conservan HTTP y formato', async (t) => {
  const h = await harness(t);
  const wrongType = await h.call('/api/login', {
    method: 'POST', contentType: 'text/plain', rawBody: '{}',
  });
  assert.equal(wrongType.status, 400);
  assert.equal(wrongType.body.code, 'JSON_REQUIRED');

  const malformed = await h.call('/api/login', {
    method: 'POST', rawBody: '{',
  });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.code, 'INVALID_JSON');

  const tooLarge = await h.call('/api/requests', {
    method: 'POST', rawBody: JSON.stringify({ notes: 'x'.repeat(65_536) }),
  });
  assert.equal(tooLarge.status, 400);
  assert.equal(tooLarge.body.code, 'REQUEST_TOO_LARGE');

  const unknownApi = await h.call('/api/no-existe');
  assert.equal(unknownApi.status, 404);
  assert.deepEqual(unknownApi.body, { error: 'No se encontró la ruta', code: 'NOT_FOUND' });
  const unknownPage = await h.call('/ruta-inexistente');
  assert.equal(unknownPage.status, 200);
  assert.match(unknownPage.headers.get('content-type'), /text\/html/);
});

test('límites de cantidad y cotización aceptan máximos válidos y rechazan valores fuera de rango', async (t) => {
  const h = await harness(t);
  const estimateAtLimit = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-001', quantity: 1_000_000, unit: 'unidad' },
  });
  assert.equal(estimateAtLimit.status, 200);
  assert.equal(estimateAtLimit.body.units, 1_000_000);

  const tooManyUnits = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-001', quantity: 6_945, unit: 'gruesa' },
  });
  assert.equal(tooManyUnits.status, 400);
  assert.equal(tooManyUnits.body.code, 'QUANTITY_LIMIT');
  const invalidQuantity = await h.call('/api/estimate', {
    method: 'POST', body: { articleId: 'ART-001', quantity: 0, unit: 'unidad' },
  });
  assert.equal(invalidQuantity.status, 400);
  assert.equal(invalidQuantity.body.code, 'INVALID_INPUT');

  const cookie = await manager(h);
  const quoteInput = { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 500, validDays: 365 };
  const maximumQuote = await h.call('/api/quotes', { method: 'POST', cookie, body: quoteInput });
  assert.equal(maximumQuote.status, 201, JSON.stringify(maximumQuote.body));
  for (const invalid of [
    { ...quoteInput, markupPercent: 500.01 },
    { ...quoteInput, markupPercent: -0.01 },
    { ...quoteInput, validDays: 366 },
    { ...quoteInput, validDays: 0 },
    { ...quoteInput, quantity: 6_945, unit: 'gruesa' },
  ]) {
    const response = await h.call('/api/quotes', { method: 'POST', cookie, body: invalid });
    assert.equal(response.status, 400);
    assert.ok(['INVALID_INPUT', 'QUANTITY_LIMIT'].includes(response.body.code), JSON.stringify(response.body));
  }
});

test('recepción y precio de insumo aplican máximos, mínimos y sanitización de texto', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const maximumReceipt = await h.call('/api/stock/receive', {
    method: 'POST', cookie, body: { insumoId: 'INS-IGNIFUGO', grams: 100_000_000, memo: 'x'.repeat(500) },
  });
  assert.equal(maximumReceipt.status, 200, JSON.stringify(maximumReceipt.body));
  for (const invalid of [
    { insumoId: 'INS-IGNIFUGO', grams: 0, memo: 'Ingreso' },
    { insumoId: 'INS-IGNIFUGO', grams: 100_000_001, memo: 'Ingreso' },
    { insumoId: 'INS-IGNIFUGO', grams: 1, memo: 'x'.repeat(501) },
    { insumoId: 'INS-IGNIFUGO', grams: 1, memo: 'nota <no permitida>' },
  ]) {
    const response = await h.call('/api/stock/receive', { method: 'POST', cookie, body: invalid });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'INVALID_INPUT');
  }
  changeDatabase(h.dbPath, 'UPDATE insumos SET stock_grams = ? WHERE id = ?', 999_999_999_999, 'INS-IGNIFUGO');
  const stockLimit = await h.call('/api/stock/receive', {
    method: 'POST', cookie, body: { insumoId: 'INS-IGNIFUGO', grams: 2, memo: 'Excede el stock total' },
  });
  assert.equal(stockLimit.status, 400);
  assert.equal(stockLimit.body.code, 'STOCK_LIMIT');
  assert.equal(readDatabase(h.dbPath, 'SELECT stock_grams FROM insumos WHERE id = ?', 'INS-IGNIFUGO').stock_grams, 999_999_999_999);

  const maximumPrice = await h.call('/api/insumos/INS-IGNIFUGO/price', {
    method: 'POST', cookie, body: { priceCentsPerKg: 1_000_000_000 },
  });
  assert.equal(maximumPrice.status, 200);
  for (const priceCentsPerKg of [0, 1_000_000_001]) {
    const response = await h.call('/api/insumos/INS-IGNIFUGO/price', {
      method: 'POST', cookie, body: { priceCentsPerKg },
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'INVALID_INPUT');
  }
});

test('solicitud aplica límites de campos, formato de contacto y valida artículo público', async (t) => {
  const h = await harness(t);
  const valid = {
    articleId: 'ART-001', quantity: 1, unit: 'unidad', special: false, notes: '',
    company: 'Taller', cuit: cuitFrom(), email: 'contacto@example.com', phone: '123456789', consent: true,
  };
  const created = await h.call('/api/requests', { method: 'POST', body: valid });
  assert.equal(created.status, 201);
  const invalidCases = [
    { ...valid, company: 'x'.repeat(121) },
    { ...valid, email: `${'x'.repeat(250)}@a.co` },
    { ...valid, phone: '123456' },
    { ...valid, notes: 'x'.repeat(1_001) },
    { ...valid, articleId: 'ART-003' },
  ];
  const expectedCodes = ['INVALID_INPUT', 'INVALID_INPUT', 'INVALID_PHONE', 'INVALID_INPUT', 'INVALID_ARTICLE'];
  for (const [index, body] of invalidCases.entries()) {
    const response = await h.call('/api/requests', { method: 'POST', body });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, expectedCodes[index]);
  }
});

test('estados y fechas inválidos se rechazan antes de alterar cotización y pedido', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const quote = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7 },
  });
  assert.equal(quote.status, 201);

  const acceptBeforeSend = await h.call(`/api/quotes/${quote.body.id}/accept`, { method: 'POST', cookie, body: {} });
  assert.equal(acceptBeforeSend.status, 409);
  assert.equal(acceptBeforeSend.body.code, 'INVALID_QUOTE_STATE');
  const orderBeforeAccept = await h.call(`/api/quotes/${quote.body.id}/order`, {
    method: 'POST', cookie, body: { dueDate: dueDate() },
  });
  assert.equal(orderBeforeAccept.status, 409);
  assert.equal(orderBeforeAccept.body.code, 'INVALID_QUOTE_STATE');

  assert.equal((await h.call(`/api/quotes/${quote.body.id}/send`, { method: 'POST', cookie, body: {} })).status, 200);
  const duplicateSend = await h.call(`/api/quotes/${quote.body.id}/send`, { method: 'POST', cookie, body: {} });
  assert.equal(duplicateSend.status, 409);
  assert.equal(duplicateSend.body.code, 'INVALID_QUOTE_STATE');
  assert.equal((await h.call(`/api/quotes/${quote.body.id}/accept`, { method: 'POST', cookie, body: {} })).status, 200);
  const duplicateAccept = await h.call(`/api/quotes/${quote.body.id}/accept`, { method: 'POST', cookie, body: {} });
  assert.equal(duplicateAccept.status, 409);
  assert.equal(duplicateAccept.body.code, 'INVALID_QUOTE_STATE');

  for (const invalidDate of ['2026-02-30', dueDate(-1), '29/10/2026']) {
    const response = await h.call(`/api/quotes/${quote.body.id}/order`, {
      method: 'POST', cookie, body: { dueDate: invalidDate },
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'INVALID_DATE');
  }
  const originalDueDate = dueDate();
  const order = await h.call(`/api/quotes/${quote.body.id}/order`, {
    method: 'POST', cookie, body: { dueDate: originalDueDate },
  });
  assert.equal(order.status, 200);

  const invalidStatusValue = await h.call(`/api/orders/${order.body.id}/state`, {
    method: 'POST', cookie, body: { status: 'Pagado' },
  });
  assert.equal(invalidStatusValue.status, 400);
  assert.equal(invalidStatusValue.body.code, 'INVALID_INPUT');
  const invalidState = await h.call(`/api/orders/${order.body.id}/state`, {
    method: 'POST', cookie, body: { status: 'Cobrado' },
  });
  assert.equal(invalidState.status, 409);
  assert.equal(invalidState.body.code, 'INVALID_STATE_TRANSITION');
  for (const priority of [0, 11]) {
    const invalidPlan = await h.call(`/api/orders/${order.body.id}/plan`, {
      method: 'POST', cookie, body: { machineId: 'M-01', priority },
    });
    assert.equal(invalidPlan.status, 400);
    assert.equal(invalidPlan.body.code, 'INVALID_INPUT');
  }
  const plan = await h.call(`/api/orders/${order.body.id}/plan`, {
    method: 'POST', cookie, body: { machineId: 'M-01', priority: 1 },
  });
  assert.equal(plan.status, 200);
  const lowestPriority = await h.call(`/api/orders/${order.body.id}/plan`, {
    method: 'POST', cookie, body: { machineId: 'M-01', priority: 10 },
  });
  assert.equal(lowestPriority.status, 200);
  const start = await h.call(`/api/orders/${order.body.id}/start`, { method: 'POST', cookie, body: {} });
  assert.equal(start.status, 200);
  const ready = await h.call(`/api/orders/${order.body.id}/progress`, {
    method: 'POST', cookie, body: { producedUnits: 1, qualityChecked: true },
  });
  assert.equal(ready.status, 200);
  const delivered = await h.call(`/api/orders/${order.body.id}/state`, {
    method: 'POST', cookie, body: { status: 'Entregado' },
  });
  assert.equal(delivered.status, 200);
  const finalizedDate = await h.call(`/api/orders/${order.body.id}/date`, {
    method: 'POST', cookie, body: { dueDate: dueDate(10), memo: 'Pedido finalizado' },
  });
  assert.equal(finalizedDate.status, 409);
  assert.equal(finalizedDate.body.code, 'INVALID_ORDER_STATE');
  for (const due of ['2026-02-30', dueDate(-1)]) {
    const invalidReschedule = await h.call(`/api/orders/${order.body.id}/date`, {
      method: 'POST', cookie, body: { dueDate: due, memo: 'Fecha no válida' },
    });
    assert.equal(invalidReschedule.status, 400);
    assert.equal(invalidReschedule.body.code, 'INVALID_DATE');
  }
  const noMemo = await h.call(`/api/orders/${order.body.id}/date`, {
    method: 'POST', cookie, body: { dueDate: dueDate(10), memo: '' },
  });
  assert.equal(noMemo.status, 400);
  assert.equal(noMemo.body.code, 'INVALID_INPUT');
  assert.equal((await h.call('/api/bootstrap', { cookie })).body.orders.find((item) => item.id === order.body.id).dueDate, originalDueDate);
});

test('recepción de stock asigna faltantes FIFO en varios pedidos, no al pedido más nuevo', async (t) => {
  const h = await harness(t);
  const cookie = await manager(h);
  const first = await makeOrder(h, cookie, { quantity: 3, unit: 'gruesa' });
  const second = await makeOrder(h, cookie, { quantity: 3, unit: 'gruesa' });
  changeDatabase(h.dbPath, "UPDATE orders SET created_at = '2020-01-01T00:00:00.000Z' WHERE id = ?", first.orderId);
  changeDatabase(h.dbPath, "UPDATE orders SET created_at = '2020-01-02T00:00:00.000Z' WHERE id = ?", second.orderId);

  await receiveBlackMaterials(h, cookie);
  const orders = (await h.call('/api/bootstrap', { cookie })).body.orders;
  const firstOrder = orders.find((item) => item.id === first.orderId);
  const secondOrder = orders.find((item) => item.id === second.orderId);
  assert.deepEqual(firstOrder.requirements.map(({ insumoId, reservedGrams }) => [insumoId, reservedGrams]), [
    ['INS-ALMA', 300], ['INS-NEGRO', 600],
  ]);
  assert.deepEqual(secondOrder.requirements.map(({ insumoId, reservedGrams }) => [insumoId, reservedGrams]), [
    ['INS-ALMA', 0], ['INS-NEGRO', 0],
  ]);
});

test('fallo SQLite dentro de la vinculación de cotización revierte cotización y solicitud', async (t) => {
  const h = await harness(t);
  const request = await h.call('/api/requests', {
    method: 'POST', body: {
      articleId: 'ART-001', quantity: 1, unit: 'unidad', special: false, notes: '',
      company: 'Prospecto QA', cuit: cuitFrom(), email: 'prospecto@example.com', phone: '123456789', consent: true,
    },
  });
  assert.equal(request.status, 201);
  changeDatabase(h.dbPath, `CREATE TRIGGER qa_reject_request_link
    BEFORE UPDATE OF client_id ON requests
    WHEN NEW.client_id IS NOT NULL
    BEGIN SELECT RAISE(ABORT, 'qa rollback trigger'); END`);

  const cookie = await manager(h);
  const failed = await h.call('/api/quotes', {
    method: 'POST', cookie,
    body: { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'unidad', markupPercent: 25, validDays: 7, requestId: request.body.id },
  });
  assert.equal(failed.status, 500);
  assert.equal(failed.body.code, 'INTERNAL_ERROR');
  assert.equal(readDatabase(h.dbPath, 'SELECT COUNT(*) AS count FROM quotes WHERE request_id = ?', request.body.id).count, 0);
  assert.deepEqual({ ...readDatabase(h.dbPath, 'SELECT client_id, status FROM requests WHERE id = ?', request.body.id) }, {
    client_id: null, status: 'Nueva',
  });
});

test('cuenta deshabilitada puede rehabilitarse con tecnología y requiere nueva sesión', async (t) => {
  const h = await harness(t);
  const technologyCookie = (await login(h, 'sergio')).cookie;
  const oldOperatorCookie = (await login(h, 'operario')).cookie;
  const disabled = await h.call('/api/users/usr-operario/enabled', {
    method: 'POST', cookie: technologyCookie, body: { enabled: false },
  });
  assert.equal(disabled.status, 200);
  assert.equal((await h.call('/api/me', { cookie: oldOperatorCookie })).body.user, null);
  assert.equal((await login(h, 'operario')).status, 401);

  const enabled = await h.call('/api/users/usr-operario/enabled', {
    method: 'POST', cookie: technologyCookie, body: { enabled: true },
  });
  assert.equal(enabled.status, 200);
  assert.equal((await h.call('/api/me', { cookie: oldOperatorCookie })).body.user, null);
  const newLogin = await login(h, 'operario');
  assert.equal(newLogin.status, 200);
  assert.equal(newLogin.body.user.role, 'operator');
  assert.deepEqual((await h.call('/api/me', { cookie: newLogin.cookie })).body.user, newLogin.body.user);
});
