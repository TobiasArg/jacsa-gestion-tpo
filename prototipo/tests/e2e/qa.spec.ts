import { readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// One serial launcher-owned database; every case starts from the API demo snapshot.
const headers = { 'X-Jacsa-Request': '1' };
const password = 'Jacsa2026!';
const day = (days = 7) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
async function post(api: APIRequestContext, path: string, data: object = {}, status = 200) {
  const response = await api.post(path, { headers, data });
  expect(response.status(), `${path}: ${await response.text()}`).toBe(status);
  return response.json();
}
async function auth(api: APIRequestContext, username = 'rodrigo') {
  await post(api, '/api/login', { username, password });
}
async function snapshot(api: APIRequestContext) {
  const response = await api.get('/api/bootstrap');
  expect(response.status()).toBe(200);
  return response.json();
}
async function open(page: Page, username: string, route: string) {
  await auth(page.request, username);
  await page.goto(`/#/${route}`);
  await page.reload(); // API authentication changes cookies, not an already mounted App's role.
  await expect(page.locator('.logout-button')).toBeVisible();
}
async function quote(api: APIRequestContext, quantity = 10) {
  return post(api, '/api/quotes', { clientId: 'CLI-ALFA', articleId: 'ART-001', quantity, unit: 'unidad', markupPercent: 25, validDays: 7 }, 201);
}
async function order(api: APIRequestContext, quantity = 10) {
  const q = await quote(api, quantity);
  await post(api, `/api/quotes/${q.id}/send`);
  await post(api, `/api/quotes/${q.id}/accept`);
  return post(api, `/api/quotes/${q.id}/order`, { dueDate: day() });
}
async function detail(page: Page, api: APIRequestContext, id: string) {
  const record = (await snapshot(api)).orders.find((o: { id: string }) => o.id === id);
  await page.getByRole('button', { name: `Ver orden ${record.number}`, exact: true }).click();
  return page.getByRole('dialog');
}
function fixture(sql: string, ...values: (string | number)[]) {
  const manifestFile = process.env.JACSA_E2E_DB_MANIFEST;
  if (!manifestFile || !resolve(manifestFile).startsWith(`${resolve('test-results/qa-preparacion')}/`)) throw new Error('Requiere manifest opt-in del launcher E2E');
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  const directory = realpathSync(manifest.directory);
  const dbPath = realpathSync(manifest.dbPath);
  expect(manifest.demo).toBe(true);
  expect(manifest.port).toBe(Number(new URL(String(test.info().project.use.baseURL)).port));
  expect(dirname(directory)).toBe(realpathSync(tmpdir()));
  expect(basename(directory)).toMatch(/^jacsa-playwright-/);
  expect(dirname(dbPath)).toBe(directory);
  expect(basename(dbPath)).toBe('demo.sqlite');
  const db = new DatabaseSync(dbPath);
  try {
    expect(db.prepare("SELECT value FROM meta WHERE key = 'demo_only'").get()?.value).toBe('1');
    db.exec('BEGIN IMMEDIATE');
    try { db.prepare(sql).run(...values); db.exec('COMMIT'); }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  } finally { db.close(); }
}

test.beforeEach(async ({ request }) => {
  await auth(request);
  await post(request, '/api/demo/reset', { confirmation: 'REINICIAR DEMO' });
  const initial = await snapshot(request);
  expect(initial.orders).toHaveLength(2);
  expect(initial.requests).toHaveLength(0);
  expect(initial.notifications).toHaveLength(0);
});

test('F09: actualizar precio por UI conserva la cotización histórica', async ({ page, request }) => {
  const q = await quote(request);
  const before = (await snapshot(request)).quotes.find((item: { id: string }) => item.id === q.id);
  await open(page, 'lorena', 'stock');
  await page.getByLabel('Material', { exact: true }).selectOption('INS-NEGRO');
  await page.getByLabel('Nuevo precio (ARS por kg)').fill('15000,00');
  await page.getByRole('button', { name: 'Guardar precio' }).click();
  await expect(page.getByText('Precio de insumo actualizado; las cotizaciones históricas se conservan.')).toBeVisible();
  const after = await snapshot(request);
  expect(after.insumos.find((i: { id: string }) => i.id === 'INS-NEGRO').priceCentsPerKg).toBe(1500000);
  expect(after.quotes.find((item: { id: string }) => item.id === q.id)).toEqual(before);
  await page.goto('/#/avisos');
  await expect(page.locator('.notification-row')).toHaveCount(0);
});

test('F14: reprogramar exige motivo y conserva fecha, historial y aviso', async ({ page, request }) => {
  const o = await order(request);
  await open(page, 'rodrigo', 'pedidos');
  const dialog = await detail(page, request, o.id);
  await dialog.getByLabel('Nueva fecha').fill(day(12));
  await dialog.getByRole('button', { name: 'Guardar fecha' }).click();
  expect((await snapshot(request)).orders.find((x: { id: string }) => x.id === o.id).dueDate).toBe(day());
  await dialog.getByLabel('Motivo', { exact: true }).fill('Acuerdo de entrega con cliente E2E');
  await dialog.getByRole('button', { name: 'Guardar fecha' }).click();
  await expect(dialog.getByText('Fecha actualizada y aviso registrado.')).toBeVisible();
  const s = await snapshot(request);
  const updated = s.orders.find((x: { id: string }) => x.id === o.id);
  expect(updated.dueDate).toBe(day(12));
  expect(JSON.stringify(updated.history)).toContain('Acuerdo de entrega con cliente E2E');
  expect(JSON.stringify(s.notifications)).toContain('Acuerdo de entrega con cliente E2E');
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.goto('/#/avisos');
  const notice = page.locator('.notification-row').filter({ hasText: 'Cambio de fecha' });
  await notice.getByRole('button', { name: 'Ver detalle' }).click();
  await expect(notice).toContainText('Acuerdo de entrega con cliente E2E');
});

test('F12: avance parcial, acumulado sin doble consumo y calidad al total', async ({ page, request }) => {
  const o = await order(request);
  await post(request, `/api/orders/${o.id}/plan`, { machineId: 'M-04', priority: 1 });
  await post(request, `/api/orders/${o.id}/start`);
  await open(page, 'operario', 'cola');
  const dialog = await detail(page, request, o.id);
  await dialog.getByLabel('Unidades acumuladas · 10 total').fill('4');
  const qc = dialog.getByRole('checkbox', { name: /Control de calidad aprobado/ });
  await expect(qc).toBeDisabled();
  await dialog.getByRole('button', { name: 'Guardar avance' }).click();
  await expect(dialog.getByText('Avance acumulado actualizado; consumo incremental registrado.')).toBeVisible();
  const partial = await snapshot(request);
  expect(partial.orders.find((x: { id: string }) => x.id === o.id).producedUnits).toBe(4);
  await dialog.getByRole('button', { name: 'Guardar avance' }).click();
  await expect.poll(async () => (await snapshot(request)).insumos.find((x: { id: string }) => x.id === 'INS-NEGRO').stockGrams).toBe(392);
  await dialog.getByLabel('Unidades acumuladas · 10 total').fill('3');
  await expect(dialog.getByRole('button', { name: 'Guardar avance' })).toBeDisabled();
  await dialog.getByLabel('Unidades acumuladas · 10 total').fill('10');
  await qc.check();
  await dialog.getByRole('button', { name: 'Guardar avance' }).click();
  await expect(dialog.getByText('Listo', { exact: true })).toBeVisible();
  const final = await snapshot(request);
  expect(final.orders.find((x: { id: string }) => x.id === o.id).qualityChecked).toBe(true);
  expect(final.insumos.find((x: { id: string }) => x.id === 'INS-NEGRO').stockGrams).toBe(380);
});

test('F13/D9: entrega y cobro por UI; historial visible pero no activo en portal', async ({ page, request, browser }) => {
  const o = await order(request);
  await post(request, `/api/orders/${o.id}/plan`, { machineId: 'M-04', priority: 1 });
  await post(request, `/api/orders/${o.id}/start`);
  await post(request, `/api/orders/${o.id}/progress`, { producedUnits: 10, qualityChecked: true });
  await open(page, 'lorena', 'pedidos');
  await page.getByLabel('Mostrar', { exact: true }).selectOption('all');
  const dialog = await detail(page, request, o.id);
  for (const state of ['Entregado', 'Pendiente de cobro', 'Cobrado']) {
    await dialog.getByRole('button', { name: `Marcar ${state}`, exact: true }).click();
    await expect(dialog.getByText(state, { exact: true })).toBeVisible();
    expect((await snapshot(request)).orders.find((x: { id: string }) => x.id === o.id).status).toBe(state);
    if (state === 'Pendiente de cobro') {
      const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
      try {
        const client = await context.newPage();
        await open(client, 'cliente', 'portal');
        await expect(client.locator('.portal-order-row').filter({ hasText: 'Cordón industrial' })).toContainText(state);
        await expect(client.locator('.portal-summary-strip > div').filter({ hasText: 'Pedidos en curso' }).locator('b')).toHaveText('1');
      } finally { await context.close(); }
    }
  }
  await expect(dialog.getByRole('button', { name: /^Marcar / })).toHaveCount(0);
});

for (const [username, route, denied] of [['operario', 'cola', 'cotizaciones'], ['lorena', 'dashboard', 'usuarios'], ['sergio', 'usuarios', 'pedidos'], ['rodrigo', 'dashboard', 'usuarios'], ['cliente2', 'portal', 'stock']]) {
  test(`F01/F02: ${username} restaura sesión, guarda ruta y cierra sesión`, async ({ page }) => {
    await open(page, username, route);
    await page.reload();
    await expect(page.locator('.logout-button')).toBeVisible();
    await page.goto(`/#/${denied}`);
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await page.locator('.logout-button').click();
    await expect(page).toHaveURL(/#\/login$/);
    expect((await (await page.request.get('/api/me')).json()).user).toBeNull();
  });
}

test('F19: deshabilitar invalida sesión; habilitar permite nuevo login sin restaurar cookie vieja', async ({ page, browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const operator = await context.newPage();
    await open(operator, 'operario', 'cola');
    await open(page, 'sergio', 'usuarios');
    await expect(page.getByRole('button', { name: 'Sesión actual' })).toBeDisabled();
    const row = page.locator('.user-row').filter({ hasText: '@operario' });
    await row.getByRole('button', { name: 'Deshabilitar' }).click();
    await expect(row).toContainText('Deshabilitada');
    await operator.reload();
    await expect(operator).toHaveURL(/#\/login$/);
    await operator.getByLabel('Usuario').fill('operario');
    await operator.locator('#password').fill(password);
    await operator.getByRole('button', { name: 'Ingresar' }).click();
    await expect(operator.getByRole('alert')).toBeVisible();
    await row.getByRole('button', { name: 'Habilitar', exact: true }).click();
    await expect(row).toContainText('Habilitada');
    expect((await (await operator.request.get('/api/me')).json()).user).toBeNull();
    await operator.getByRole('button', { name: 'Ingresar' }).click();
    await expect(operator).toHaveURL(/#\/cola$/);
  } finally { await context.close(); }
});

test('F20: reset confirmado por UI vuelve al snapshot semilla y conserva sesión técnica', async ({ page, request }) => {
  await order(request);
  await open(page, 'sergio', 'usuarios');
  await page.getByRole('button', { name: 'Solicitar reinicio' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Confirmar reinicio' })).toBeDisabled();
  await dialog.getByLabel('Escribe exactamente REINICIAR DEMO').fill('REINICIAR DEMO');
  await dialog.getByRole('button', { name: 'Confirmar reinicio' }).click();
  await expect(page.getByText('Datos de demostración reiniciados.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Usuarios y entorno demo' })).toBeVisible();
  await auth(request);
  const s = await snapshot(request);
  expect(s.orders.map((x: { id: string }) => x.id).sort()).toEqual(['order-demo-001', 'order-demo-002']);
  expect(s.notifications).toHaveLength(0);
});

test('D1: borrador invisible; enviar por UI publica solo para Alfa', async ({ page, browser, request }) => {
  const q = await quote(request);
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const client = await context.newPage();
    await open(client, 'cliente', 'portal');
    await expect.soft(client.locator('.portal-quote-row').filter({ hasText: 'Cordón industrial' })).toHaveCount(0);
    expect.soft((await snapshot(client.request)).quotes.some((x: { id: string }) => x.id === q.id)).toBe(false);
    await open(page, 'rodrigo', 'cotizaciones');
    await page.locator('.quote-record').filter({ hasText: 'Cordón industrial' }).getByRole('button', { name: 'Enviar propuesta' }).click();
    await expect(page.locator('.quote-record').filter({ hasText: 'Cordón industrial' })).toContainText('Enviada');
    await client.reload();
    await expect(client.locator('.portal-quote-row').filter({ hasText: 'Cordón industrial' })).toContainText('Enviada');
    await auth(client.request, 'cliente2');
    await client.reload();
    await expect(client.locator('.portal-quote-row').filter({ hasText: 'Cordón industrial' })).toHaveCount(0);
  } finally { await context.close(); }
});

test('D2: solicitud anónima sin preselección se vincula al cliente elegido al cotizar', async ({ page, playwright }) => {
  const anonymous = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const r = await post(anonymous, '/api/requests', { articleId: 'ART-001', quantity: 10, unit: 'unidad', special: false, company: 'Anónima QA', cuit: '30709999997', email: 'alfa@example.com', phone: '+54 11 5555 0101', consent: true, notes: 'Vinculación explícita QA' }, 201);
    await open(page, 'rodrigo', `cotizaciones?requestId=${r.id}`);
    await expect(page.getByLabel('Cliente', { exact: true })).toHaveValue('');
    await expect(page.locator('.request-context')).toContainText('Solicitud sin cuenta');
    await page.getByLabel('Cliente', { exact: true }).selectOption('CLI-ALFA');
    await page.getByRole('button', { name: 'Crear cotización' }).click();
    await expect(page.getByText('Cotización creada como borrador (Pendiente). El cliente la verá recién al enviarla.')).toBeVisible();
    await auth(anonymous, 'cliente');
    expect.soft((await snapshot(anonymous)).requests.some((x: { id: string }) => x.id === r.id)).toBe(true);
    await auth(anonymous, 'cliente2');
    expect((await snapshot(anonymous)).requests.some((x: { id: string }) => x.id === r.id)).toBe(false);
  } finally { await anonymous.dispose(); }
});

test('D5: encolar en ocupada por UI; orden por prioridad y bloqueo de inicio', async ({ page, request }) => {
  const running = await order(request);
  await post(request, `/api/orders/${running.id}/plan`, { machineId: 'M-04', priority: 5 });
  await post(request, `/api/orders/${running.id}/start`);
  const queued = await order(request);
  await open(page, 'rodrigo', 'pedidos');
  const dialog = await detail(page, request, queued.id);
  await dialog.getByLabel('Máquina', { exact: true }).selectOption('M-04');
  await dialog.getByLabel('Prioridad (1 = más urgente)', { exact: true }).fill('1');
  const planned = page.waitForResponse((response) => response.url().endsWith(`/api/orders/${queued.id}/plan`) && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Guardar plan' }).click();
  const planResponse = await planned;
  expect(planResponse.status(), await planResponse.text()).toBe(200);
  await expect(dialog.getByText('Máquina y prioridad asignadas.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Iniciar producción' })).toBeDisabled();
  await open(page, 'operario', 'cola');
  const group = page.getByRole('region', { name: 'Máquina 04', exact: true });
  const s = await snapshot(request);
  const number = (id: string) => s.orders.find((x: { id: string }) => x.id === id).number;
  await expect(group.locator('.order-number')).toHaveText([number(running.id), number(queued.id)]);
});

test('D7: mínimos físicos en stock y resumen tras consumo, sin confundir reservas', async ({ page, request }) => {
  const o = await order(request, 190);
  await post(request, `/api/orders/${o.id}/plan`, { machineId: 'M-04', priority: 1 });
  await open(page, 'lorena', 'stock');
  const black = page.getByRole('row').filter({ hasText: 'Hilado negro' });
  await expect(black.getByText('Bajo mínimo', { exact: true })).toHaveCount(0);
  await post(request, `/api/orders/${o.id}/start`);
  await post(request, `/api/orders/${o.id}/progress`, { producedUnits: 190, qualityChecked: true });
  await page.reload();
  await expect(black.getByText('Bajo mínimo', { exact: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Alma negra' }).getByText('Bajo mínimo', { exact: true })).toBeVisible();
  const s = await snapshot(request);
  expect.soft(s.insumos.find((x: { id: string }) => x.id === 'INS-NEGRO').belowMinimum).toBe(true);
  expect(s.insumos.find((x: { id: string }) => x.id === 'INS-NEGRO').stockGrams).toBe(20);
  await page.goto('/#/dashboard');
  await expect(page.locator('.metric-card').filter({ hasText: 'Insumos bajo mínimo' })).toContainText('2');
});

test('D5 UI: cola agrupa por máquina y ordena prioridad antes de fecha', async ({ page, request }) => {
  const low = await order(request);
  const urgent = await order(request);
  await post(request, `/api/orders/${low.id}/plan`, { machineId: 'M-04', priority: 9 });
  await post(request, `/api/orders/${urgent.id}/plan`, { machineId: 'M-04', priority: 1 });
  await post(request, `/api/orders/${urgent.id}/date`, { dueDate: day(12), memo: 'Prioridad prevalece sobre fecha' });
  await open(page, 'operario', 'cola');
  const s = await snapshot(request);
  const number = (id: string) => s.orders.find((x: { id: string }) => x.id === id).number;
  const group = page.getByRole('region', { name: 'Máquina 04', exact: true });
  await expect(group.locator('.order-number')).toHaveText([number(urgent.id), number(low.id)]);
  await expect(group.locator('.queue-position')).toHaveText(['#1', '#2']);
  await group.getByRole('button', { name: `Ver orden ${number(urgent.id)}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Guardar plan' })).toHaveCount(0);
});

test('D6: límites de cantidad por unidad y notas especiales antes de enviar', async ({ page }) => {
  await page.goto('/#/cotizador');
  const quantity = page.getByLabel('Cantidad', { exact: true });
  await expect(quantity).toHaveAttribute('max', '1000000');
  await page.getByLabel('Unidad de venta').selectOption('gruesa');
  await expect(quantity).toHaveAttribute('max', '6944');
  await quantity.fill('6945');
  await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled();
  await quantity.fill('1');
  await page.getByLabel('Unidad de venta').selectOption('100pares');
  await expect(quantity).toHaveAttribute('max', '5000');
  await page.getByLabel('Largo (cm)').fill('121');
  const notes = page.getByLabel('Notas del desarrollo');
  await expect(notes).toHaveAttribute('maxlength', '800');
  await notes.fill('x'.repeat(800));
  await expect(notes).toHaveValue('x'.repeat(800));
});

test('D8: demora de ayer visible a staff y operario pero no expuesta al cliente', async ({ page, request }) => {
  fixture('UPDATE orders SET due_date = ? WHERE id = ?', day(-1), 'order-demo-001');
  await open(page, 'rodrigo', 'pedidos');
  await expect(page.locator('.order-card').filter({ hasText: 'PED-DEMO-001' })).toContainText('Demorado');
  await page.getByLabel('Mostrar', { exact: true }).selectOption('delayed');
  await expect(page.locator('.order-card')).toHaveCount(1);
  expect.soft((await snapshot(request)).orders.find((x: { id: string }) => x.id === 'order-demo-001').delayed).toBe(true);
  await open(page, 'operario', 'cola');
  await expect(page.locator('.order-card').filter({ hasText: 'PED-DEMO-001' })).toContainText('Demorado');
  await open(page, 'cliente', 'portal');
  expect((await snapshot(page.request)).orders.find((x: { id: string }) => x.id === 'order-demo-001')).not.toHaveProperty('delayed');
  await expect(page.getByText('Demorado', { exact: true })).toHaveCount(0);
});

test('D3/D4: sin contacto aviso pendiente y no éxito falso; reintento UI con contacto no duplica', async ({ page, request }) => {
  const o = await order(request);
  fixture("UPDATE clients SET email = '' WHERE id = 'CLI-ALFA'");
  await post(request, `/api/orders/${o.id}/date`, { dueDate: day(12), memo: 'Aviso sin contacto QA' });
  let s = await snapshot(request);
  const n = s.notifications.find((x: { body: string }) => x.body.includes('Aviso sin contacto QA'));
  expect.soft(n.status).toBe('Pendiente de reintento');
  fixture("UPDATE notifications SET status = 'Pendiente de reintento', recipient = '' WHERE id = ?", n.id);
  const pending = (await snapshot(request)).notifications.find((x: { id: string }) => x.id === n.id);
  // A missing recipient must fail without changing this persisted row (D4).
  const retry = await request.post(`/api/notifications/${n.id}/retry`, { headers, data: {} });
  expect.soft(retry.status()).toBe(409);
  expect.soft((await retry.json()).code).toBe('NOTIFICATION_RECIPIENT_MISSING');
  expect.soft((await snapshot(request)).notifications.find((x: { id: string }) => x.id === n.id)).toEqual(pending);
  // Dedicated negative fixture makes UI retry independently observable on old backends too.
  fixture("UPDATE notifications SET status = 'Pendiente de reintento', recipient = '' WHERE id = ?", n.id);
  await open(page, 'rodrigo', 'avisos');
  const row = page.locator('.notification-row').filter({ hasText: n.orderId }).filter({ hasText: 'Cambio de fecha' });
  await expect(row).toContainText('Sin contacto del cliente');
  await expect(row.getByRole('button', { name: 'Reintentar registro' })).toHaveCount(0);
  fixture("UPDATE clients SET email = 'restaurado@example.com' WHERE id = 'CLI-ALFA'");
  await page.reload();
  await row.getByRole('button', { name: 'Reintentar registro' }).click();
  await expect(row).toContainText('Registrada');
  await expect.soft(row).toContainText('restaurado@example.com');
  s = await snapshot(request);
  expect(s.notifications.filter((x: { id: string }) => x.id === n.id)).toHaveLength(1);
  await expect(row.getByRole('button', { name: 'Reintentar registro' })).toHaveCount(0);
});
