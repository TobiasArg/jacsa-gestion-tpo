import { expect, test, type BrowserContext, type Page } from '@playwright/test';

// QA del build browser-demo: sin backend. Los datos viven en localStorage del origen y el perfil en sessionStorage de cada pestaña.
const password = 'Jacsa2026!';
const obsoleteDemoCopy = /Demo local en este navegador|se guardan solo aquí|no se comparten en la nube|no son una medida de seguridad|datos ficticios|datos sintéticos|entorno académico|académic|entorno de demostración|usuarios y demo|información de muestra|solo datos locales/i;

// Cualquier request a /api/ es un fallo: la demo estática resuelve todo con el engine local.
// Se aborta en el navegador porque `vite preview` hereda el proxy /api → 127.0.0.1:3001.
function guardApi(context: BrowserContext) {
  const apiCalls: string[] = [];
  void context.route((url) => url.pathname.startsWith('/api/'), (route) => {
    apiCalls.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return route.abort();
  });
  return apiCalls;
}

async function login(page: Page, username: string) {
  if (!/#\/login/.test(page.url())) await page.goto('/#/login');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.locator('.logout-button')).toBeVisible();
  await expect(page.locator('.app-footer')).toContainText('PROTOTIPO FUNCIONAL');
}

async function logout(page: Page) {
  await page.locator('.logout-button').click();
  await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
}

async function go(page: Page, route: string, heading: string) {
  await page.goto(`/#/${route}`);
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
}

test('carga estática: título, assets, login y copy profesional sin backend', async ({ page, context }) => {
  const apiCalls = guardApi(context);
  const failedAssets: string[] = [];
  page.on('response', (response) => { if (response.status() >= 400) failedAssets.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await expect(page).toHaveTitle(/JACSA/);
  await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);
  await expect(page.locator('.auth-kicker')).toHaveText('Prototipo funcional');
  await expect(page.locator('body')).not.toContainText(obsoleteDemoCopy);
  await page.getByRole('button', { name: 'Cotizador público' }).click();
  await expect(page.getByRole('note')).toContainText('Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.');
  await expect(page.locator('body')).not.toContainText(obsoleteDemoCopy);
  await page.getByRole('button', { name: 'Volver a mi portal' }).last().click();
  await expect(page.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
  await login(page, 'rodrigo');
  await expect(page.getByRole('note')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(obsoleteDemoCopy);
  await go(page, 'avisos', 'Bandeja de avisos');
  await expect(page.getByText('Prototipo funcional: registra las notificaciones; los envíos externos no están habilitados.', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(obsoleteDemoCopy);
  expect(failedAssets).toEqual([]);
  expect(apiCalls).toEqual([]);
});

test('cinco recorridos en una pestaña con login secuencial, persistencia tras reload y reset local confirmado', async ({ page, context }) => {
  const apiCalls = guardApi(context);

  // 1 · Cliente Alfa solicita 2 gruesas de ART-001.
  await page.goto('/#/login');
  await login(page, 'cliente');
  await expect(page.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
  await expect(page.locator('.portal-requests')).toContainText('Tus nuevas solicitudes aparecerán en este listado.');
  await page.getByRole('button', { name: 'Nueva solicitud' }).first().click();
  await expect(page.getByRole('note')).toContainText('Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.');
  await page.getByLabel('Artículo o desarrollo especial').selectOption('ART-001');
  await page.getByLabel('Cantidad', { exact: true }).fill('2');
  await page.getByLabel('Unidad de venta').selectOption('gruesa');
  await expect(page.locator('.estimate-values strong')).toContainText('26.136');
  await expect(page.locator('.estimate-values span')).toContainText('21.600');
  await expect(page.locator('.estimate-values span')).toContainText('4.536');
  await expect(page.locator('.estimate-values small')).toContainText('288 unidades calculadas');
  await page.getByLabel('Teléfono').fill('+54 11 5555 0101');
  await page.getByRole('checkbox', { name: /Autorizo el registro de estos datos/ }).check();
  await page.getByRole('button', { name: 'Registrar solicitud' }).click();
  const requestStatus = page.getByRole('status').filter({ hasText: 'registrada' });
  await expect(requestStatus).toBeVisible();
  await expect(requestStatus).toContainText('No se notificó al equipo comercial.');
  await page.getByRole('button', { name: 'Volver a mi portal', exact: true }).first().click();
  await expect(page.locator('.portal-requests tbody tr')).toHaveCount(1);
  await expect(page.locator('.portal-requests tbody tr')).toContainText('Nueva');
  await logout(page);

  // 2 · Rodrigo cotiza, envía, registra aceptación y convierte en pedido con faltantes 176/88 g.
  await login(page, 'rodrigo');
  await page.getByRole('button', { name: 'Preparar cotización' }).click();
  await expect(page.getByRole('heading', { name: 'Cotizaciones', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Crear cotización' }).click();
  const quoteCard = page.locator('.quote-record').filter({ hasText: 'Cordón industrial' }).filter({ hasText: 'Cliente Alfa' });
  await expect(quoteCard).toContainText('26.136');
  await expect(quoteCard).toContainText('21.600');
  await expect(quoteCard).toContainText('4.536');
  await quoteCard.getByRole('button', { name: 'Enviar propuesta' }).click();
  await expect(quoteCard.getByText('Enviada', { exact: true })).toBeVisible();
  await quoteCard.getByRole('button', { name: 'Registrar aceptación' }).click();
  await expect(quoteCard.getByText('Aceptada', { exact: true })).toBeVisible();
  await quoteCard.getByRole('button', { name: 'Convertir en pedido' }).click();
  await expect(page.getByText('Pedido creado; la reserva se actualizó en el inventario.')).toBeVisible();
  await go(page, 'pedidos', 'Pedidos');
  const managerOrder = page.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });
  await expect(managerOrder).toContainText('Faltante de material');
  await managerOrder.getByRole('button', { name: /^Ver orden / }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.locator('.requirement-row').filter({ hasText: 'Hilado negro' })).toContainText('Reservado 400 g');
  await expect(dialog.locator('.requirement-row').filter({ hasText: 'Hilado negro' })).toContainText('Faltan 176 g');
  await expect(dialog.locator('.requirement-row').filter({ hasText: 'Alma negra' })).toContainText('Reservado 200 g');
  await expect(dialog.locator('.requirement-row').filter({ hasText: 'Alma negra' })).toContainText('Faltan 88 g');
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await logout(page);

  // 3 · Lorena ingresa 200/100 g; Rodrigo planifica M-04 prioridad 1.
  await login(page, 'lorena');
  await go(page, 'stock', 'Stock e insumos');
  await expect(page.getByText('264 g de faltante', { exact: true })).toBeVisible();
  for (const [material, grams] of [['INS-NEGRO', '200'], ['INS-ALMA', '100']]) {
    await page.getByLabel('Material').selectOption(material);
    await page.getByLabel('Cantidad recibida (gramos)').fill(grams);
    await page.getByLabel('Memo del movimiento').fill(`QA demo · ingreso ${material}`);
    await page.getByRole('button', { name: 'Registrar ingreso' }).click();
    await expect(page.getByText('Ingreso registrado y reservas pendientes recalculadas.')).toBeVisible();
  }
  await expect(page.getByText('Disponibilidad cubierta', { exact: true })).toBeVisible();
  await logout(page);
  await login(page, 'rodrigo');
  await go(page, 'pedidos', 'Pedidos');
  await expect(managerOrder).toContainText('Reserva completa');
  await managerOrder.getByRole('button', { name: /^Ver orden / }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Máquina').selectOption('M-04');
  await dialog.getByLabel('Prioridad (1 = más urgente)', { exact: true }).fill('1');
  await dialog.getByRole('button', { name: 'Guardar plan' }).click();
  await expect(dialog.getByText('Máquina y prioridad asignadas.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await logout(page);

  // 4 · Operario produce 288 unidades con QC; quedan 24/12 g físicos.
  await login(page, 'operario');
  await expect(page.getByRole('heading', { name: 'Cola de producción' })).toBeVisible();
  const operatorOrder = page.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });
  await operatorOrder.getByRole('button', { name: /^Ver orden / }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Iniciar producción' }).click();
  await expect(dialog.getByText('Producción iniciada con la reserva de materiales validada.')).toBeVisible();
  await dialog.getByLabel('Unidades acumuladas · 288 total').fill('288');
  await dialog.getByRole('checkbox', { name: /Control de calidad aprobado/ }).check();
  await dialog.getByRole('button', { name: 'Guardar avance' }).click();
  await expect(dialog.getByText('Listo', { exact: true })).toBeVisible();
  await expect(dialog.locator('.requirements-list')).toContainText('Consumido 576 g');
  await expect(dialog.locator('.requirements-list')).toContainText('Consumido 288 g');
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await logout(page);
  await login(page, 'lorena');
  await go(page, 'stock', 'Stock e insumos');
  await expect(page.getByRole('row').filter({ hasText: 'Hilado negro' }).first()).toContainText('24 g');
  await expect(page.getByRole('row').filter({ hasText: 'Alma negra' }).first()).toContainText('12 g');
  await logout(page);

  // 5 · Cliente ve su pedido Listo y avisos registrados; persiste tras recargar.
  await login(page, 'cliente');
  const portalOrder = page.locator('.portal-order-row').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '288 / 288 unidades' });
  await expect(portalOrder).toContainText('Listo');
  await expect(portalOrder).toContainText('Calidad verificada');
  for (const event of ['Cotización enviada', 'En producción', 'Listo']) {
    await expect(page.locator('.portal-notice-row').filter({ hasText: event })).toContainText('Registrada');
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
  await expect(portalOrder).toContainText('Listo');
  const stored = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('jacsa-demo:')));
  expect(stored).toContain('jacsa-demo:v1');
  await logout(page);

  // Reset local confirmado (perfil technology) vuelve al seed.
  await login(page, 'sergio');
  await go(page, 'usuarios', 'Usuarios y accesos');
  await expect(page.getByRole('heading', { name: 'Prototipo funcional', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(obsoleteDemoCopy);
  await page.getByRole('button', { name: 'Restablecer datos' }).click();
  const confirm = page.getByRole('dialog');
  await expect(confirm.getByRole('button', { name: 'Confirmar reinicio' })).toBeDisabled();
  await confirm.getByLabel('Escribe exactamente REINICIAR DEMO').fill('REINICIAR DEMO');
  await confirm.getByRole('button', { name: 'Confirmar reinicio' }).click();
  await expect(page.getByText('Datos del prototipo restablecidos.')).toBeVisible();
  await logout(page);
  await login(page, 'cliente');
  await expect(page.locator('.portal-requests')).toContainText('Tus nuevas solicitudes aparecerán en este listado.');
  await expect(page.locator('.portal-order-row').filter({ hasText: '288 / 288 unidades' })).toHaveCount(0);

  expect(apiCalls).toEqual([]);
});

test('pestañas del mismo navegador comparten datos con roles independientes; otro contexto no los ve', async ({ browser, context }) => {
  const apiCalls = guardApi(context);
  const managerTab = await context.newPage();
  const clientTab = await context.newPage();
  await managerTab.goto('/#/login');
  await login(managerTab, 'rodrigo');
  await clientTab.goto('/#/login');
  await login(clientTab, 'cliente');

  await clientTab.getByRole('button', { name: 'Nueva solicitud' }).first().click();
  await clientTab.getByLabel('Artículo o desarrollo especial').selectOption('ART-001');
  await clientTab.getByLabel('Cantidad', { exact: true }).fill('2');
  await clientTab.getByLabel('Unidad de venta').selectOption('gruesa');
  await clientTab.getByLabel('Teléfono').fill('+54 11 5555 0101');
  await clientTab.getByRole('checkbox', { name: /Autorizo el registro de estos datos/ }).check();
  await clientTab.getByRole('button', { name: 'Registrar solicitud' }).click();
  await expect(clientTab.getByRole('status').filter({ hasText: 'registrada' })).toBeVisible();

  // La pestaña manager sigue como manager y ve la solicitud creada en la otra pestaña.
  await managerTab.reload();
  await expect(managerTab.locator('.user-menu')).toContainText('Rodrigo');
  await expect(managerTab.getByRole('button', { name: 'Preparar cotización' })).toBeVisible();
  await clientTab.goto('/#/portal');
  await clientTab.reload();
  await expect(clientTab.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
  await expect(clientTab.locator('.portal-requests tbody tr')).toHaveCount(1);

  // Una pestaña nueva del mismo navegador comparte datos pero arranca sin perfil.
  const thirdTab = await context.newPage();
  await thirdTab.goto('/#/login');
  await expect(thirdTab.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();

  // Otro contexto (equivale a otro navegador/dispositivo) no ve los datos.
  const other = await browser.newContext();
  try {
    const otherApiCalls = guardApi(other);
    const otherPage = await other.newPage();
    await otherPage.goto('/#/login');
    await login(otherPage, 'rodrigo');
    await expect(otherPage.getByRole('button', { name: 'Preparar cotización' })).toHaveCount(0);
    expect(otherApiCalls).toEqual([]);
  } finally {
    await other.close();
  }
  expect(apiCalls).toEqual([]);
});
