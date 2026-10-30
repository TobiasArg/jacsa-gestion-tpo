import assert from 'node:assert/strict';
import test from 'node:test';
import { createEngine } from '../src/demo/engine.mjs';
import { BUSINESS_KEY, SESSION_KEY } from '../src/demo/store.mjs';

const NOW = new Date('2026-01-15T12:00:00.000Z');
const DUE_DATE = '2026-01-22';

class MemoryStorage {
  values = new Map();
  failWrites = false;
  clears = 0;

  get(key) {
    return this.values.get(key) ?? null;
  }

  set(key, value) {
    if (this.failWrites) {
      const error = new Error('quota');
      error.name = 'QuotaExceededError';
      throw error;
    }
    this.values.set(key, value);
  }

  remove(key) {
    this.values.delete(key);
  }

  clear() {
    this.clears += 1;
    this.values.clear();
  }
}

function setup({ storage = new MemoryStorage(), session = new MemoryStorage(), now = NOW, runExclusive } = {}) {
  const currentTime = { value: new Date(now) };
  const clock = { now: () => new Date(currentTime.value) };
  const engine = createEngine({ storage, session, clock, ...(runExclusive ? { runExclusive } : {}) });
  const call = (path, method = 'GET', body = {}) => engine.handle(path, method, body);
  return { engine, storage, session, call, clock, setNow: (value) => { currentTime.value = new Date(value); } };
}

async function login(call, username = 'rodrigo') {
  const result = await call('/api/login', 'POST', { username, password: 'Jacsa2026!' });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result.body.user;
}

async function createAcceptedOrder(call, { clientId = 'CLI-ALFA', quantity = 2, unit = 'gruesa', articleId = 'ART-001' } = {}) {
  const quote = await call('/api/quotes', 'POST', { clientId, articleId, quantity, unit, markupPercent: 25, validDays: 7 });
  assert.equal(quote.status, 201, JSON.stringify(quote.body));
  const quoteId = quote.body.id;
  assert.equal((await call(`/api/quotes/${quoteId}/send`, 'POST', {})).status, 200);
  assert.equal((await call(`/api/quotes/${quoteId}/accept`, 'POST', {})).status, 200);
  const order = await call(`/api/quotes/${quoteId}/order`, 'POST', { dueDate: DUE_DATE });
  assert.equal(order.status, 200, JSON.stringify(order.body));
  return { quoteId, orderId: order.body.id };
}

function businessData(storage) {
  return JSON.parse(storage.get(BUSINESS_KEY)).data;
}

test('demo maneja health y costo áureo exacto en centavos enteros', async () => {
  const { call } = setup();
  assert.deepEqual(await call('/api/health'), { status: 200, body: { ok: true } });
  assert.deepEqual((await call('/api/estimate', 'POST', { articleId: 'ART-001', quantity: 2, unit: 'gruesa' })).body, {
    available: true,
    units: 288,
    netCents: 2_160_000,
    vatCents: 453_600,
    totalCents: 2_613_600,
  });
});

test('seis perfiles aceptan la clave pública y las sesiones pertenecen al tab', async () => {
  const storage = new MemoryStorage();
  const sessionA = new MemoryStorage();
  const sessionB = new MemoryStorage();
  const tabA = setup({ storage, session: sessionA });
  const tabB = setup({ storage, session: sessionB });
  const profiles = ['rodrigo', 'lorena', 'operario', 'sergio', 'cliente', 'cliente2'];
  for (const username of profiles) {
    const user = await login(tabA.call, username);
    assert.equal(user.username, username);
  }
  await login(tabA.call, 'rodrigo');
  await login(tabB.call, 'cliente2');
  assert.equal((await tabA.call('/api/me')).body.user.username, 'rodrigo');
  assert.equal((await tabB.call('/api/me')).body.user.username, 'cliente2');
  assert.equal(sessionA.get(SESSION_KEY), JSON.stringify({ userId: 'usr-rodrigo', sessionEpoch: 0 }));
  assert.notEqual(sessionA, sessionB);
});

test('reload conserva negocio en localStorage, pero la sesión nueva de tab queda aislada', async () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const first = setup({ storage, session });
  await login(first.call, 'cliente');
  const initial = await first.call('/api/bootstrap');
  assert.equal(initial.status, 200);
  const second = setup({ storage, session });
  assert.equal((await second.call('/api/me')).body.user.username, 'cliente');
  const otherTab = setup({ storage, session: new MemoryStorage() });
  assert.deepEqual((await otherTab.call('/api/me')).body, { user: null });
  assert.equal((await otherTab.call('/api/catalog')).body.articles.length, 2);
});

test('logout elimina solo el perfil de su pestaña y deja la sesión vecina intacta', async () => {
  const storage = new MemoryStorage();
  const tabA = setup({ storage, session: new MemoryStorage() });
  const tabB = setup({ storage, session: new MemoryStorage() });
  await login(tabA.call, 'rodrigo');
  await login(tabB.call, 'cliente');
  assert.deepEqual(await tabA.call('/api/logout', 'POST', {}), { status: 200, body: { ok: true } });
  assert.deepEqual((await tabA.call('/api/me')).body, { user: null });
  assert.equal((await tabB.call('/api/me')).body.user.username, 'cliente');
});

test('bootstrap aplica filtros de datos de cliente, operador y tecnología (solo UX)', async () => {
  const { call } = setup();
  await login(call, 'cliente');
  const client = (await call('/api/bootstrap')).body;
  assert.equal(client.clients.length, 1);
  assert.equal(client.clients[0].id, 'CLI-ALFA');
  assert.equal(client.orders.every((order) => order.clientId === 'CLI-ALFA'), true);
  assert.equal(client.orders.some((order) => order.number === 'PED-DEMO-0002'), false);
  await login(call, 'operario');
  const operator = (await call('/api/bootstrap')).body;
  assert.equal(operator.clients.length, 0);
  assert.equal(operator.articles.find((article) => article.id === 'ART-001').costCents, undefined);
  assert.equal(operator.insumos.find((item) => item.id === 'INS-NEGRO').priceCentsPerKg, undefined);
  await login(call, 'sergio');
  const technology = (await call('/api/bootstrap')).body;
  assert.equal(technology.orders.length, 0);
  assert.equal(technology.quotes.length, 0);
  assert.equal(technology.users.length, 6);
});

test('flujo cliente → solicitud → cotización → pedido aparece en su portal', async () => {
  const storage = new MemoryStorage();
  const client = setup({ storage, session: new MemoryStorage() });
  const manager = setup({ storage, session: new MemoryStorage() });
  await login(client.call, 'cliente');
  const request = await client.call('/api/requests', 'POST', {
    articleId: 'ART-001', quantity: 2, unit: 'gruesa', special: false,
    company: 'Alfa Demo', cuit: '30709999997', email: 'alfa@example.com', phone: '12345678', notes: 'Entrega habitual', consent: true,
  });
  assert.equal(request.status, 201);
  const accountRequest = (await client.call('/api/bootstrap')).body.requests[0];
  assert.equal(accountRequest.id, request.body.id);
  assert.equal(accountRequest.clientId, 'CLI-ALFA');
  await login(manager.call, 'rodrigo');
  const quote = await manager.call('/api/quotes', 'POST', {
    requestId: request.body.id, clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 2, unit: 'gruesa', markupPercent: 25, validDays: 7,
  });
  assert.equal(quote.status, 201);
  await manager.call(`/api/quotes/${quote.body.id}/send`, 'POST', {});
  await manager.call(`/api/quotes/${quote.body.id}/accept`, 'POST', {});
  const order = await manager.call(`/api/quotes/${quote.body.id}/order`, 'POST', { dueDate: DUE_DATE });
  const portal = (await client.call('/api/bootstrap')).body;
  assert.equal(portal.quotes.find((item) => item.id === quote.body.id).status, 'Aceptada');
  assert.equal(portal.orders.find((item) => item.id === order.body.id).requirements, undefined);
  assert.equal(portal.notifications.some((item) => item.quoteId === quote.body.id), true);
});

test('cotización enviada/aceptada convierte una sola vez y conserva importes', async () => {
  const { call, storage } = setup();
  await login(call);
  const created = await call('/api/quotes', 'POST', { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 2, unit: 'gruesa', markupPercent: 25, validDays: 7 });
  assert.equal(created.status, 201);
  const quoteId = created.body.id;
  const quote = businessData(storage).quotes.find((item) => item.id === quoteId);
  assert.deepEqual([quote.units, quote.netCents, quote.vatCents, quote.totalCents], [288, 2_160_000, 453_600, 2_613_600]);
  assert.equal((await call(`/api/quotes/${quoteId}/send`, 'POST', {})).status, 200);
  assert.equal((await call(`/api/quotes/${quoteId}/accept`, 'POST', {})).status, 200);
  const first = await call(`/api/quotes/${quoteId}/order`, 'POST', { dueDate: DUE_DATE });
  const second = await call(`/api/quotes/${quoteId}/order`, 'POST', { dueDate: DUE_DATE });
  assert.equal(first.status, 200);
  assert.equal(first.body.id, second.body.id);
  assert.equal(businessData(storage).orders.filter((item) => item.quoteId === quoteId).length, 1);
  assert.equal(businessData(storage).notifications.filter((item) => item.quoteId === quoteId).length, 1);
});

test('reserva parcial, recepción FIFO, inicio bloqueado y consumo incremental hasta calidad', async () => {
  const { call, storage } = setup();
  await login(call);
  const first = await createAcceptedOrder(call);
  const firstPlan = await call(`/api/orders/${first.orderId}/plan`, 'POST', { machineId: 'M-01', priority: 1 });
  assert.equal(firstPlan.status, 200);
  let snapshot = (await call('/api/bootstrap')).body;
  let order = snapshot.orders.find((item) => item.id === first.orderId);
  assert.deepEqual(order.requirements.map(({ requiredGrams, reservedGrams, shortageGrams }) => ({ requiredGrams, reservedGrams, shortageGrams })), [
    { requiredGrams: 576, reservedGrams: 400, shortageGrams: 176 },
    { requiredGrams: 288, reservedGrams: 200, shortageGrams: 88 },
  ]);
  assert.equal((await call(`/api/orders/${first.orderId}/start`, 'POST', {})).body.code, 'INSUFFICIENT_STOCK');
  assert.equal((await call('/api/stock/receive', 'POST', { insumoId: 'INS-NEGRO', grams: 200, memo: 'Ingreso negro' })).status, 200);
  assert.equal((await call('/api/stock/receive', 'POST', { insumoId: 'INS-ALMA', grams: 100, memo: 'Ingreso alma' })).status, 200);
  snapshot = (await call('/api/bootstrap')).body;
  order = snapshot.orders.find((item) => item.id === first.orderId);
  assert.equal(order.requirements.reduce((sum, item) => sum + item.shortageGrams, 0), 0);
  assert.equal((await call(`/api/orders/${first.orderId}/start`, 'POST', {})).status, 200);
  await login(call, 'operario');
  assert.equal((await call(`/api/orders/${first.orderId}/progress`, 'POST', { producedUnits: 144, qualityChecked: false })).status, 200);
  const movementCount = businessData(storage).movements.length;
  assert.equal((await call(`/api/orders/${first.orderId}/progress`, 'POST', { producedUnits: 144, qualityChecked: false })).status, 200);
  assert.equal(businessData(storage).movements.length, movementCount, 'repetir progreso no duplica consumo');
  assert.equal((await call(`/api/orders/${first.orderId}/progress`, 'POST', { producedUnits: 100, qualityChecked: false })).body.code, 'PRODUCTION_DECREASE');
  assert.equal((await call(`/api/orders/${first.orderId}/progress`, 'POST', { producedUnits: 289, qualityChecked: false })).body.code, 'OVERPRODUCTION');
  assert.equal((await call(`/api/orders/${first.orderId}/progress`, 'POST', { producedUnits: 288, qualityChecked: true })).status, 200);
  snapshot = (await call('/api/bootstrap')).body;
  order = snapshot.orders.find((item) => item.id === first.orderId);
  assert.equal(order.status, 'Listo');
  assert.equal(order.qualityChecked, true);
  assert.deepEqual(snapshot.insumos.filter((item) => ['INS-NEGRO', 'INS-ALMA'].includes(item.id)).map((item) => item.stockGrams), [24, 12]);
  assert.equal(businessData(storage).movements.filter((item) => item.orderId === first.orderId).reduce((sum, item) => sum + item.grams, 0), 864);
});

test('la recepción asigna faltantes por antigüedad, sin exceder stock libre', async () => {
  const { call, setNow } = setup();
  await login(call);
  const first = await createAcceptedOrder(call);
  setNow(new Date(NOW.valueOf() + 1_000));
  const second = await createAcceptedOrder(call);
  await call('/api/stock/receive', 'POST', { insumoId: 'INS-NEGRO', grams: 200, memo: 'Reposición' });
  await call('/api/stock/receive', 'POST', { insumoId: 'INS-ALMA', grams: 100, memo: 'Reposición' });
  const snapshot = (await call('/api/bootstrap')).body;
  const older = snapshot.orders.find((item) => item.id === first.orderId);
  const newer = snapshot.orders.find((item) => item.id === second.orderId);
  assert.deepEqual(older.requirements.map((item) => item.reservedGrams), [576, 288]);
  assert.deepEqual(newer.requirements.map((item) => item.reservedGrams), [24, 12]);
  assert.deepEqual(snapshot.insumos.filter((item) => ['INS-NEGRO', 'INS-ALMA'].includes(item.id)).map((item) => item.availableGrams), [0, 0]);
});

test('estados financieros solo avanzan en secuencia', async () => {
  const { call } = setup();
  await login(call);
  const { orderId } = await createAcceptedOrder(call, { quantity: 1, unit: 'unidad' });
  await call(`/api/orders/${orderId}/plan`, 'POST', { machineId: 'M-01', priority: 2 });
  await call('/api/stock/receive', 'POST', { insumoId: 'INS-NEGRO', grams: 2, memo: 'Ingreso' });
  await call('/api/stock/receive', 'POST', { insumoId: 'INS-ALMA', grams: 1, memo: 'Ingreso' });
  await call(`/api/orders/${orderId}/start`, 'POST', {});
  await login(call, 'operario');
  await call(`/api/orders/${orderId}/progress`, 'POST', { producedUnits: 1, qualityChecked: true });
  await login(call);
  assert.equal((await call(`/api/orders/${orderId}/state`, 'POST', { status: 'Cobrado' })).body.code, 'INVALID_STATE_TRANSITION');
  assert.equal((await call(`/api/orders/${orderId}/state`, 'POST', { status: 'Entregado' })).status, 200);
  assert.equal((await call(`/api/orders/${orderId}/state`, 'POST', { status: 'Pendiente de cobro' })).status, 200);
  assert.equal((await call(`/api/orders/${orderId}/state`, 'POST', { status: 'Cobrado' })).status, 200);
});

test('cambio de fecha requiere motivo, registra outbox y actualizar precio no reescribe cotizaciones', async () => {
  const { call, storage } = setup();
  await login(call);
  const quote = await call('/api/quotes', 'POST', { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity: 1, unit: 'gruesa', markupPercent: 25, validDays: 7 });
  const quoteId = quote.body.id;
  const historicalAmount = businessData(storage).quotes.find((item) => item.id === quoteId).totalCents;
  await call(`/api/quotes/${quoteId}/send`, 'POST', {});
  await call(`/api/quotes/${quoteId}/accept`, 'POST', {});
  const createdOrder = await call(`/api/quotes/${quoteId}/order`, 'POST', { dueDate: DUE_DATE });
  const orderId = createdOrder.body.id;
  assert.equal((await call(`/api/orders/${orderId}/date`, 'POST', { dueDate: '2026-01-25', memo: '' })).status, 400);
  assert.equal((await call(`/api/orders/${orderId}/date`, 'POST', { dueDate: '2026-01-25', memo: 'Reprogramación de entrega' })).status, 200);
  assert.equal((await call('/api/insumos/INS-NEGRO/price', 'POST', { priceCentsPerKg: 1_200_000 })).status, 200);
  const data = businessData(storage);
  assert.equal(data.quotes.find((item) => item.id === quoteId).totalCents, historicalAmount);
  assert.equal(data.orders.find((item) => item.id === orderId).dueDate, '2026-01-25');
  assert.equal(data.notifications.some((item) => item.event === 'Cambio de fecha de entrega' && item.orderId === orderId), true);
  assert.equal((await call('/api/bootstrap')).body.insumos.find((item) => item.id === 'INS-NEGRO').priceCentsPerKg, 1_200_000);
});

test('tecnología no puede deshabilitarse a sí misma y una cuenta apagada pierde acceso', async () => {
  const storage = new MemoryStorage();
  const technology = setup({ storage, session: new MemoryStorage() });
  const client = setup({ storage, session: new MemoryStorage() });
  const tech = await login(technology.call, 'sergio');
  await login(client.call, 'cliente2');
  assert.equal((await technology.call(`/api/users/${tech.id}/enabled`, 'POST', { enabled: false })).body.code, 'SELF_DISABLE');
  assert.equal((await technology.call('/api/users/usr-cliente2/enabled', 'POST', { enabled: false })).status, 200);
  assert.equal((await client.call('/api/bootstrap')).body.code, 'UNAUTHENTICATED');
  const disabledLogin = await client.call('/api/login', 'POST', { username: 'cliente2', password: 'Jacsa2026!' });
  assert.equal(disabledLogin.status, 401);
  await technology.call('/api/users/usr-cliente2/enabled', 'POST', { enabled: true });
  assert.equal((await client.call('/api/bootstrap')).body.code, 'UNAUTHENTICATED');
  await login(client.call, 'cliente2');
  assert.equal((await client.call('/api/bootstrap')).status, 200);
});

test('outbox registra eventos localmente y el reintento no envía correo', async () => {
  const { call, storage } = setup();
  await login(call);
  const { quoteId } = await createAcceptedOrder(call);
  const notice = businessData(storage).notifications.find((item) => item.quoteId === quoteId);
  assert.equal(notice.status, 'Registrada');
  assert.equal((await call(`/api/notifications/${notice.id}/retry`, 'POST', {})).body.code, 'NOTIFICATION_NOT_PENDING');
  const envelope = JSON.parse(storage.get(BUSINESS_KEY));
  const storedNotice = envelope.data.notifications.find((item) => item.id === notice.id);
  storedNotice.status = 'Pendiente de reintento';
  storedNotice.recipient = '';
  storage.set(BUSINESS_KEY, JSON.stringify(envelope));
  assert.equal((await call(`/api/notifications/${notice.id}/retry`, 'POST', {})).status, 200);
  const updated = businessData(storage).notifications.find((item) => item.id === notice.id);
  assert.equal(updated.status, 'Registrada');
  assert.equal(updated.retryCount, 1);
});

test('reset exige texto exacto, conserva otras claves y repone solo los datos de esta demo', async () => {
  const { call, storage } = setup();
  await login(call);
  storage.set('unrelated-app-key', 'preserve');
  await call('/api/requests', 'POST', { articleId: 'ART-001', quantity: 1, unit: 'unidad', special: false, company: 'Empresa', cuit: '30709999997', email: 'demo@example.com', phone: '12345678', notes: '', consent: true });
  assert.equal((await call('/api/demo/reset', 'POST', { confirmation: 'reset' })).body.code, 'CONFIRMATION_REQUIRED');
  assert.equal(businessData(storage).requests.length, 1);
  assert.equal((await call('/api/demo/reset', 'POST', { confirmation: 'REINICIAR DEMO' })).status, 200);
  assert.equal(businessData(storage).requests.length, 0);
  assert.equal(businessData(storage).orders.length, 2);
  assert.equal(storage.get('unrelated-app-key'), 'preserve');
  assert.equal(storage.clears, 0);
});

test('JSON/version corruptos no se borran en silencio y el reset explícito recupera el dataset', async () => {
  const { call, storage } = setup();
  await login(call);
  storage.set(BUSINESS_KEY, '{invalid json');
  const badRead = await call('/api/catalog');
  assert.equal(badRead.status, 409);
  assert.equal(badRead.body.code, 'STORAGE_CORRUPT');
  assert.equal(storage.get(BUSINESS_KEY), '{invalid json');
  storage.set(BUSINESS_KEY, JSON.stringify({ version: 99, seededAt: NOW.toISOString(), data: {} }));
  const unsupportedVersion = await call('/api/catalog');
  assert.equal(unsupportedVersion.status, 409);
  assert.equal(unsupportedVersion.body.code, 'STORAGE_CORRUPT');
  assert.equal(JSON.parse(storage.get(BUSINESS_KEY)).version, 99);
  const reset = await call('/api/demo/reset', 'POST', { confirmation: 'REINICIAR DEMO' });
  assert.equal(reset.status, 200);
  assert.equal((await call('/api/catalog')).body.articles.length, 2);
});

test('una cuota local denegada devuelve error claro sin mutación parcial', async () => {
  const { call, storage } = setup();
  await call('/api/catalog');
  storage.failWrites = true;
  const result = await call('/api/requests', 'POST', { articleId: 'ART-001', quantity: 1, unit: 'unidad', special: false, company: 'Empresa', cuit: '30709999997', email: 'demo@example.com', phone: '12345678', notes: '', consent: true });
  assert.equal(result.status, 507);
  assert.equal(result.body.code, 'STORAGE_QUOTA');
  storage.failWrites = false;
  assert.equal(businessData(storage).requests.length, 0);
});

test('precios vencidos y artículos especiales no exponen una estimación', async () => {
  const { call, storage } = setup();
  await call('/api/catalog');
  const envelope = JSON.parse(storage.get(BUSINESS_KEY));
  envelope.data.insumos.find((item) => item.id === 'INS-NEGRO').priceDate = '2025-12-30';
  storage.set(BUSINESS_KEY, JSON.stringify(envelope));
  const stale = await call('/api/estimate', 'POST', { articleId: 'ART-001', quantity: 1, unit: 'gruesa' });
  assert.equal(stale.body.available, false);
  const special = await call('/api/estimate', 'POST', { articleId: null, quantity: 1, unit: 'unidad', special: true });
  assert.equal(special.body.available, false);
  assert.equal(special.body.units, 1);
});

test('no hay autenticación ni persistencia de credenciales seguras y las operaciones mantienen formas API', async () => {
  const { call, storage } = setup();
  assert.equal((await call('/api/bootstrap')).body.code, 'UNAUTHENTICATED');
  assert.equal((await call('/api/login', 'POST', { username: 'nadie', password: 'bad' })).body.code, 'INVALID_CREDENTIALS');
  await login(call);
  const snapshot = await call('/api/bootstrap');
  assert.equal(snapshot.status, 200);
  assert.equal(storage.get(BUSINESS_KEY).includes('Jacsa2026!'), true);
});
