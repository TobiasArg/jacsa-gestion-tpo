import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

const evidenceDirectory = fileURLToPath(new URL('../../../evidencias/prototipo/', import.meta.url));
const password = 'Jacsa2026!';

type BrowserIssue = { area: string; detail: string };

function trackBrowserIssues(page: Page, area: string, issues: BrowserIssue[]) {
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push({ area, detail: `console: ${message.text()}` });
  });
  page.on('pageerror', (error) => issues.push({ area, detail: `pageerror: ${error.message}` }));
  page.on('response', (response) => {
    if (response.status() >= 500) issues.push({ area, detail: `HTTP ${response.status()} ${response.url()}` });
  });
}

async function login(page: Page, username: string, roleHeading: string) {
  await page.goto('/#/login');
  await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
  await page.getByLabel('Usuario').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: roleHeading })).toBeVisible();
  await expect(page.locator('.logout-button')).toBeVisible();
}

async function capture(page: Page, filename: string) {
  await page.screenshot({ path: join(evidenceDirectory, filename), fullPage: true, animations: 'disabled' });
}

async function newContext(browser: Browser, contexts: BrowserContext[]) {
  const context = await browser.newContext({ viewport: { width: 1470, height: 1000 } });
  contexts.push(context);
  return context;
}

async function assertNoMobileHorizontalOverflow(page: Page, area: string) {
  const measurements = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const visibleOverflow: Array<{ element: string; left: number; right: number }> = [];
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || element.getClientRects().length === 0) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      let visibleLeft = rect.left;
      let visibleRight = rect.right;
      let ancestor = element.parentElement;
      while (ancestor) {
        const ancestorStyle = getComputedStyle(ancestor);
        if (['hidden', 'clip', 'auto', 'scroll'].includes(ancestorStyle.overflowX)) {
          const ancestorRect = ancestor.getBoundingClientRect();
          visibleLeft = Math.max(visibleLeft, ancestorRect.left);
          visibleRight = Math.min(visibleRight, ancestorRect.right);
        }
        ancestor = ancestor.parentElement;
      }
      if (visibleLeft < -1 || visibleRight > viewportWidth + 1) {
        visibleOverflow.push({ element: `${element.tagName.toLowerCase()}.${element.className.toString().trim().replace(/\s+/g, '.')}`, left: visibleLeft, right: visibleRight });
      }
    }
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      visibleOverflow,
    };
  });

  expect(measurements.documentWidth, `${area}: document ${JSON.stringify(measurements)}`).toBeLessThanOrEqual(measurements.viewportWidth);
  expect(measurements.bodyWidth, `${area}: body ${JSON.stringify(measurements)}`).toBeLessThanOrEqual(measurements.viewportWidth);
  expect(measurements.visibleOverflow, `${area}: visible elements ${JSON.stringify(measurements)}`).toEqual([]);
}

test('recorrido integrado: solicitud, cotización, abastecimiento, producción y portal', async ({ browser }) => {
  mkdirSync(evidenceDirectory, { recursive: true });
  const issues: BrowserIssue[] = [];
  const contexts: BrowserContext[] = [];

  try {
    const clientContext = await newContext(browser, contexts);
    const clientPage = await clientContext.newPage();
    trackBrowserIssues(clientPage, 'cliente', issues);
    await login(clientPage, 'cliente', 'Hola, Cliente Alfa.');

    await clientPage.getByRole('button', { name: 'Nueva solicitud' }).first().click();
    await expect(clientPage.getByRole('heading', { name: 'Empecemos por aquí' })).toBeVisible();
    await clientPage.getByLabel('Artículo o desarrollo especial').selectOption('ART-001');
    await clientPage.getByLabel('Cantidad', { exact: true }).fill('2');
    await clientPage.getByLabel('Unidad de venta').selectOption('gruesa');
    await expect(clientPage.locator('.estimate-values strong')).toContainText('26.136');
    await clientPage.getByLabel('Teléfono').fill('+54 11 5555 0101');
    await clientPage.getByRole('checkbox', { name: /Autorizo el uso de estos datos/ }).check();
    await capture(clientPage, '01cotizador.png');
    await clientPage.getByRole('button', { name: 'Enviar solicitud' }).click();
    const requestSuccess = clientPage.getByRole('status').filter({ hasText: 'registrada' });
    await expect(requestSuccess).toBeVisible();
    const requestId = (await requestSuccess.innerText()).match(/request-[a-f\d-]+/i)?.[0];
    expect(requestId, 'La UI debe devolver el identificador de la solicitud creada').toBeTruthy();

    const managerContext = await newContext(browser, contexts);
    const managerPage = await managerContext.newPage();
    trackBrowserIssues(managerPage, 'manager', issues);
    await login(managerPage, 'rodrigo', 'Buen día, Rodrigo.');
    await expect(managerPage.getByText('Cliente Alfa', { exact: true })).toBeVisible();
    await managerPage.getByRole('button', { name: 'Preparar cotización' }).click();
    await expect(managerPage.getByRole('heading', { name: 'Cotizaciones', exact: true })).toBeVisible();
    await expect(managerPage.locator('.request-context-label')).toContainText(requestId!);
    await expect(managerPage.getByLabel('Cantidad')).toHaveValue('2');
    await expect(managerPage.getByLabel('Unidad')).toHaveValue('gruesa');
    await expect(managerPage.getByLabel('Recargo sobre costo (%)')).toHaveValue('25');
    await expect(managerPage.getByLabel('Vigencia (días)')).toHaveValue('7');

    await managerPage.getByRole('button', { name: 'Crear cotización' }).click();
    const quoteCard = managerPage.locator('.quote-record').filter({ hasText: 'Cordón industrial' }).filter({ hasText: 'Cliente Alfa' });
    await expect(quoteCard).toBeVisible();
    await expect(quoteCard).toContainText('Recargo 25%');
    await expect(quoteCard).toContainText('26.136');
    await capture(managerPage, '02cotizacion.png');
    await quoteCard.getByRole('button', { name: 'Enviar propuesta' }).click();
    await expect(quoteCard.getByText('Enviada', { exact: true })).toBeVisible();
    await quoteCard.getByRole('button', { name: 'Registrar aceptación' }).click();
    await expect(quoteCard.getByText('Aceptada', { exact: true })).toBeVisible();
    await quoteCard.getByRole('button', { name: 'Convertir en pedido' }).click();
    await expect(managerPage.getByText('Pedido creado; la reserva se actualizó en el inventario.')).toBeVisible();

    await managerPage.getByRole('button', { name: 'Stock e insumos' }).click();
    await expect(managerPage.getByRole('heading', { name: 'Stock e insumos', exact: true })).toBeVisible();
    await expect(managerPage.getByText('176 g', { exact: true })).toBeVisible();
    await expect(managerPage.getByText('88 g', { exact: true })).toBeVisible();
    await capture(managerPage, '03stockfaltante.png');

    const adminContext = await newContext(browser, contexts);
    const adminPage = await adminContext.newPage();
    trackBrowserIssues(adminPage, 'admin', issues);
    await login(adminPage, 'lorena', 'Buen día, Lorena.');
    await adminPage.getByRole('button', { name: 'Stock e insumos' }).click();
    await expect(adminPage.getByRole('heading', { name: 'Stock e insumos', exact: true })).toBeVisible();
    await adminPage.getByLabel('Material').selectOption('INS-NEGRO');
    await adminPage.getByLabel('Cantidad recibida (gramos)').fill('200');
    await adminPage.getByLabel('Memo del movimiento').fill('Recepción E2E de hilado negro');
    await adminPage.getByRole('button', { name: 'Registrar ingreso' }).click();
    await expect(adminPage.getByText('Ingreso registrado y reservas pendientes recalculadas.')).toBeVisible();
    await adminPage.getByLabel('Material').selectOption('INS-ALMA');
    await adminPage.getByLabel('Cantidad recibida (gramos)').fill('100');
    await adminPage.getByLabel('Memo del movimiento').fill('Recepción E2E de alma negra');
    await adminPage.getByRole('button', { name: 'Registrar ingreso' }).click();
    await expect(adminPage.getByText('Ingreso registrado y reservas pendientes recalculadas.')).toBeVisible();

    await managerPage.getByRole('button', { name: 'Pedidos' }).click();
    await expect(managerPage.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
    const newOrder = managerPage.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });
    await expect(newOrder).toBeVisible();
    await newOrder.getByRole('button', { name: 'Ver orden' }).click();
    const managerDialog = managerPage.getByRole('dialog');
    await expect(managerDialog.getByRole('heading', { name: 'Cordón industrial' })).toBeVisible();
    await managerDialog.getByLabel('Máquina').selectOption('M-04');
    await managerDialog.getByRole('button', { name: 'Guardar plan' }).click();
    await expect(managerDialog.getByText('Máquina y prioridad asignadas.')).toBeVisible();
    await expect(managerDialog.locator('.order-detail-summary')).toContainText('Máquina 04');
    await expect(managerDialog.getByText('Reserva completa')).toBeVisible();
    await managerDialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(newOrder).toContainText('Máquina 04');
    await capture(managerPage, '04tableropedidos.png');

    const operatorContext = await newContext(browser, contexts);
    const operatorPage = await operatorContext.newPage();
    trackBrowserIssues(operatorPage, 'operario', issues);
    await login(operatorPage, 'operario', 'Cola de producción');
    const operatorOrder = operatorPage.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });
    await expect(operatorOrder).toBeVisible();
    await operatorOrder.getByRole('button', { name: 'Ver orden' }).click();
    const operatorDialog = operatorPage.getByRole('dialog');
    await expect(operatorDialog.locator('.order-detail-summary')).toContainText('Máquina 04');
    await operatorDialog.getByRole('button', { name: 'Iniciar producción' }).click();
    await expect(operatorDialog.getByText('Producción iniciada con la reserva de materiales validada.')).toBeVisible();
    await operatorDialog.getByLabel('Unidades acumuladas · 288 total').fill('288');
    const qualityCheck = operatorDialog.getByRole('checkbox', { name: /Control de calidad aprobado/ });
    await expect(qualityCheck).toBeEnabled();
    await qualityCheck.check();
    await operatorDialog.getByRole('button', { name: 'Guardar avance' }).click();
    await expect(operatorDialog.getByText('Listo', { exact: true })).toBeVisible();
    await operatorDialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(operatorOrder).toContainText('Listo');
    await expect(operatorOrder).toContainText('Calidad verificada');
    await capture(operatorPage, '05operariocola.png');

    await managerPage.getByRole('button', { name: 'Bandeja de avisos' }).click();
    await expect(managerPage.getByRole('heading', { name: 'Bandeja de avisos', exact: true })).toBeVisible();
    const managerNotices = managerPage.locator('.notification-row');
    await expect(managerNotices).toHaveCount(3);
    await expect(managerNotices.filter({ hasText: 'En producción' })).toHaveCount(1);
    await expect(managerNotices.filter({ hasText: 'Listo' })).toHaveCount(1);
    const quoteNotice = managerPage.locator('.notification-row').filter({ hasText: 'Cotización enviada' }).filter({ hasText: 'alfa@example.com' });
    await expect(quoteNotice).toHaveCount(1);
    await expect(managerPage.getByText('Registrada no significa enviada.')).toBeVisible();

    await clientPage.reload();
    await expect(clientPage.getByRole('heading', { name: 'Empecemos por aquí' })).toBeVisible();
    await clientPage.getByRole('button', { name: 'Mi portal', exact: true }).click();
    await expect(clientPage.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
    const clientQuote = clientPage.locator('.portal-quote-row').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });
    const clientOrder = clientPage.locator('.portal-order-row').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '288 / 288 unidades' });
    await expect(clientQuote).toContainText('Aceptada');
    await expect(clientOrder).toContainText('Listo');
    await expect(clientOrder).toContainText('Calidad verificada');
    const seededOrder = clientPage.locator('.portal-order-row').filter({ hasText: 'Cordón de poliéster' });
    await expect(seededOrder).toContainText('0 / 200 unidades');
    await expect(clientPage.locator('.portal-requests')).toContainText('Cotizada');
    await expect(clientPage.getByText('Cliente Beta', { exact: true })).toHaveCount(0);
    await expect(clientPage.locator('body')).not.toContainText('Recargo');
    const clientNotices = clientPage.locator('.portal-notice-row');
    await expect(clientPage.getByRole('heading', { name: 'Mis avisos' })).toBeVisible();
    await expect(clientNotices).toHaveCount(3);
    await expect(clientNotices.filter({ hasText: 'En producción' })).toHaveCount(1);
    await expect(clientNotices.filter({ hasText: 'Listo' })).toHaveCount(1);
    const ownSnapshotResponse = await clientContext.request.get('http://127.0.0.1:3001/api/bootstrap');
    expect(ownSnapshotResponse.status()).toBe(200);
    const ownSnapshot = await ownSnapshotResponse.json();
    expect(ownSnapshot.notifications).toHaveLength(3);
    expect(ownSnapshot.notifications.map((notice: { event: string }) => notice.event).sort()).toEqual([
      'Cotización enviada', 'En producción', 'Listo',
    ].sort());
    expect(ownSnapshot.notifications.every((notice: { clientId: string }) => notice.clientId === 'CLI-ALFA')).toBe(true);
    await capture(clientPage, '06portalcliente.png');

    const betaContext = await newContext(browser, contexts);
    const betaPage = await betaContext.newPage();
    trackBrowserIssues(betaPage, 'cliente Beta', issues);
    await login(betaPage, 'cliente2', 'Hola, Cliente Beta.');
    await expect(betaPage.locator('.portal-notifications')).toContainText('Sin avisos registrados');
    await expect(betaPage.locator('.portal-notice-row')).toHaveCount(0);
    await expect(betaPage.locator('.portal-order-row').filter({ hasText: 'Cordón industrial' })).toHaveCount(0);
    await expect(betaPage.getByText('Cliente Alfa', { exact: true })).toHaveCount(0);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }

  expect(issues, 'El flujo principal debe terminar sin errores de consola, excepciones ni HTTP 5xx').toEqual([]);
});

test('configurador: coincidencia exacta, desarrollo manual, límites y recuperación del precio', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1470, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.goto('/#/cotizador');
    await expect(page.getByRole('heading', { name: 'Empecemos por aquí' })).toBeVisible();
    await expect(page.getByLabel('Hilado / material')).toHaveValue('Algodón');
    await expect(page.getByLabel('Cantidad de hilos')).toHaveValue('16');
    await expect(page.getByLabel('Color')).toHaveValue('Negro');
    await expect(page.getByLabel('Tramado')).toHaveValue('Tramado cerrado');
    await expect(page.getByLabel('Largo (cm)')).toHaveValue('120');
    await page.getByLabel('Cantidad', { exact: true }).fill('2');
    await page.getByLabel('Unidad de venta').selectOption('gruesa');
    await expect(page.locator('.estimate-values strong')).toContainText('26.136');

    await page.getByLabel('Empresa / nombre').fill('Configurador especial E2E');
    await page.getByLabel('CUIT').fill('30709999997');
    await page.getByLabel('Correo electrónico').fill('configurador@example.com');
    await page.getByLabel('Teléfono').fill('+54 11 5555 0102');
    await page.getByRole('checkbox', { name: /Autorizo el uso de estos datos/ }).check();

    await page.getByLabel('Largo (cm)').fill('121');
    await expect(page.locator('.configuration-summary')).toContainText('Revisión manual');
    await expect(page.locator('.estimate-values')).toHaveCount(0);
    await expect(page.locator('.estimate-reason')).toContainText('El artículo requiere una cotización especial');
    await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled();
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'registrada' })).toBeVisible();

    const threadCount = page.getByLabel('Cantidad de hilos');
    await expect(threadCount).toHaveAttribute('max', '32');
    await threadCount.fill('33');
    await expect(page.locator('.configuration-summary')).toContainText('Configuración incompleta');
    await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled();
    await expect(page.locator('.estimate-values')).toHaveCount(0);

    await threadCount.fill('16');
    await expect(page.locator('.configuration-summary')).toContainText('Revisión manual');
    await expect(page.locator('.estimate-values')).toHaveCount(0);
    await page.getByLabel('Largo (cm)').fill('120');
    await expect(page.locator('.configuration-summary')).toContainText('Coincidencia exacta · ART-001');
    await expect(page.locator('.estimate-values strong')).toContainText('26.136');
  } finally {
    await context.close();
  }
});

test('estimaciones públicas especiales y sin equivalente no muestran importes', async ({ request }) => {
  const headers = { 'X-Jacsa-Request': '1' };
  const specialResponse = await request.post('/api/estimate', {
    headers,
    data: { articleId: null, quantity: 1, unit: 'unidad', special: true },
  });
  expect(specialResponse.status()).toBe(200);
  const special = await specialResponse.json();
  expect(special.available).toBe(false);
  expect(special).not.toHaveProperty('netCents');
  expect(special).not.toHaveProperty('totalCents');

  const unmatchedResponse = await request.post('/api/estimate', {
    headers,
    data: { articleId: 'ART-SIN-EQUIVALENTE', quantity: 1, unit: 'unidad' },
  });
  expect(unmatchedResponse.status()).toBe(200);
  const unmatched = await unmatchedResponse.json();
  expect(unmatched.available).toBe(false);
  expect(unmatched).not.toHaveProperty('netCents');
  expect(unmatched).not.toHaveProperty('totalCents');
});

test('cliente autenticado no puede abrir la ruta de cotizaciones del equipo', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1470, height: 1000 } });
  try {
    const page = await context.newPage();
    await login(page, 'cliente', 'Hola, Cliente Alfa.');
    await page.goto('/#/cotizaciones');
    await expect(page).toHaveURL(/#\/portal$/);
    await expect(page.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cotizaciones', exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('login móvil conserva etiquetas, foco visible y no desborda el viewport', async ({ browser }) => {
  mkdirSync(evidenceDirectory, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('/#/login');
    const username = page.getByLabel('Usuario');
    const userPassword = page.locator('#password');
    await expect(username).toBeVisible();
    await expect(userPassword).toBeVisible();
    await expect(page.locator('label[for="username"]')).toHaveText('Usuario');
    await expect(page.locator('label[for="password"]')).toHaveText('Contraseña');
    await username.focus();
    const focusStyle = await username.evaluate((element) => {
      const style = getComputedStyle(element);
      return { boxShadow: style.boxShadow, outlineWidth: style.outlineWidth };
    });
    expect(focusStyle.boxShadow !== 'none' || focusStyle.outlineWidth !== '0px').toBe(true);
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(dimensions.document, `Desborde horizontal document ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.body, `Desborde horizontal body ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport);
    await capture(page, '07mobilelogin.png');

    await login(page, 'cliente', 'Hola, Cliente Alfa.');
    await assertNoMobileHorizontalOverflow(page, 'portal cliente autenticado');
    await page.getByRole('button', { name: 'Nueva solicitud', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Empecemos por aquí' })).toBeVisible();
    await assertNoMobileHorizontalOverflow(page, 'cotizador autenticado');
  } finally {
    await context.close();
  }
});
