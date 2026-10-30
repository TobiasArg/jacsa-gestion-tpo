import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type APIResponse, type Browser, type BrowserContext, type Page } from '@playwright/test';

const evidenceDirectory = process.env.JACSA_EVIDENCE_DIR === undefined
  ? fileURLToPath(new URL('../../../evidencias/qa-final/rehearsal/', import.meta.url))
  : resolve(process.env.JACSA_EVIDENCE_DIR, 'rehearsal');
const password = 'Jacsa2026!';
const requestHeaders = { 'X-Jacsa-Request': '1' };
const clientId = 'CLI-ALFA';
const articleId = 'ART-001';
const quantity = 2;
const unit = 'gruesa';
const units = 288;
const expectedAmounts = { netCents: 2_160_000, vatCents: 453_600, totalCents: 2_613_600 };
const materialIds = ['INS-NEGRO', 'INS-ALMA'] as const;

type RequestRecord = {
  id: string;
  clientId?: string;
  articleId: string | null;
  quantity: number;
  unit: string;
  status: string;
};

type QuoteRecord = {
  id: string;
  requestId?: string;
  clientId: string;
  articleId: string;
  quantity: number;
  unit: string;
  units: number;
  netCents: number;
  vatCents: number;
  totalCents: number;
  status: string;
};

type RequirementRecord = {
  insumoId: string;
  requiredGrams: number;
  reservedGrams: number;
  consumedGrams: number;
  shortageGrams: number;
};

type OrderRecord = {
  id: string;
  number: string;
  quoteId?: string;
  clientId?: string;
  articleId: string;
  quantity: number;
  unit: string;
  units: number;
  producedUnits: number;
  status: string;
  priority: number;
  machineId: string | null;
  qualityChecked: boolean;
  requirements?: RequirementRecord[];
};

type BootstrapSnapshot = {
  user: { username: string; role: string; clientId?: string };
  clients: Array<{ id: string; name: string }>;
  requests: RequestRecord[];
  quotes: QuoteRecord[];
  orders: OrderRecord[];
  insumos: Array<{
    id: string;
    stockGrams: number;
    reservedGrams: number;
    availableGrams: number;
    minGrams: number;
    belowMinimum: boolean;
    requiredGrams: number;
    shortageGrams: number;
  }>;
  notifications: Array<{
    id: string;
    clientId: string;
    event: string;
    status: string;
    orderId?: string;
    quoteId?: string;
  }>;
};

type Workflow = {
  requestId: string | null;
  quoteId: string | null;
  orderId: string | null;
  estimateObservedInUi: boolean;
};

type UiAction = {
  blockId: string;
  checkpoint: string;
  action: string;
  transport: 'browser-ui';
  execution: 'Playwright; interacción automatizada, no ensayo humano';
  startedAt: string;
  endedAt: string;
  elapsedMs: number;
  outcome: 'completada' | 'fallida';
};

type ApiEvent = {
  kind: 'preparacion-api' | 'lectura-api';
  action: string;
  method: string;
  path: string;
  username?: string;
  status: number | null;
  startedAt: string;
  endedAt: string;
  elapsedMs: number;
  outcome: 'completada' | 'fallida';
  error?: string;
};

function configuredBaseURL(): string {
  const baseURL = test.info().project.use.baseURL;
  if (typeof baseURL !== 'string') throw new Error('La configuración Playwright debe definir baseURL.');
  return baseURL;
}

function arsFromCents(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function newContext(browser: Browser, contexts: BrowserContext[], baseURL: string) {
  const context = await browser.newContext({ baseURL, viewport: { width: 1470, height: 1000 } });
  contexts.push(context);
  return context;
}

async function timedUiAction<T>(actions: UiAction[], blockId: string, checkpoint: string, action: string, run: () => Promise<T>): Promise<T> {
  const startedAt = new Date().toISOString();
  const started = process.hrtime.bigint();
  let outcome: UiAction['outcome'] = 'completada';
  try {
    return await run();
  } catch (error) {
    outcome = 'fallida';
    throw error;
  } finally {
    actions.push({
      blockId,
      checkpoint,
      action,
      transport: 'browser-ui',
      execution: 'Playwright; interacción automatizada, no ensayo humano',
      startedAt,
      endedAt: new Date().toISOString(),
      elapsedMs: Number(process.hrtime.bigint() - started) / 1_000_000,
      outcome,
    });
  }
}

async function recordApiEvent<T>(
  events: ApiEvent[],
  kind: ApiEvent['kind'],
  action: string,
  method: string,
  path: string,
  perform: () => Promise<APIResponse>,
  validate: (response: APIResponse, payload: T) => void,
  username?: string,
): Promise<T> {
  const startedAt = new Date().toISOString();
  const started = process.hrtime.bigint();
  let status: number | null = null;
  let outcome: ApiEvent['outcome'] = 'completada';
  let detail: string | undefined;
  try {
    const response = await perform();
    status = response.status();
    const payload = await response.json() as T;
    validate(response, payload);
    return payload;
  } catch (error) {
    outcome = 'fallida';
    detail = errorMessage(error);
    throw error;
  } finally {
    events.push({
      kind,
      action,
      method,
      path,
      ...(username ? { username } : {}),
      status,
      startedAt,
      endedAt: new Date().toISOString(),
      elapsedMs: Number(process.hrtime.bigint() - started) / 1_000_000,
      outcome,
      ...(detail ? { error: detail } : {}),
    });
  }
}

async function prepareLogin(context: BrowserContext, username: string, events: ApiEvent[]) {
  return recordApiEvent<{ user: { username: string } }>(
    events,
    'preparacion-api',
    `Autenticar ${username} para el contexto aislado`,
    'POST',
    '/api/login',
    () => context.request.post(new URL('/api/login', configuredBaseURL()).toString(), { headers: requestHeaders, data: { username, password } }),
    (response, payload) => {
      expect(response.status(), 'El login API de preparación debe responder 200.').toBe(200);
      expect(payload.user.username).toBe(username);
    },
    username,
  );
}

async function readManagerSnapshot(context: BrowserContext, events: ApiEvent[], action: string): Promise<BootstrapSnapshot> {
  return recordApiEvent<BootstrapSnapshot>(
    events,
    'lectura-api',
    action,
    'GET',
    '/api/bootstrap',
    () => context.request.get(new URL('/api/bootstrap', configuredBaseURL()).toString()),
    (response) => expect(response.status(), 'La lectura de snapshot debe responder 200.').toBe(200),
    'rodrigo',
  );
}

function checkpointState(snapshot: BootstrapSnapshot, workflow: Workflow, blockId: string, checkpoint: string, phase: 'entrada' | 'salida') {
  const request = workflow.requestId ? snapshot.requests.find((item) => item.id === workflow.requestId) ?? null : null;
  const quote = workflow.quoteId
    ? snapshot.quotes.find((item) => item.id === workflow.quoteId) ?? null
    : workflow.requestId
      ? snapshot.quotes.find((item) => item.requestId === workflow.requestId) ?? null
      : null;
  const order = workflow.orderId
    ? snapshot.orders.find((item) => item.id === workflow.orderId) ?? null
    : quote
      ? snapshot.orders.find((item) => item.quoteId === quote.id) ?? null
      : null;
  const client = snapshot.clients.find((item) => item.id === clientId);
  const demand = order ?? quote ?? request;
  const stock = materialIds.map((id) => {
    const item = snapshot.insumos.find((candidate) => candidate.id === id);
    return item ? { ...item } : null;
  });
  const quoteAmounts = quote ? {
    netCents: quote.netCents,
    vatCents: quote.vatCents,
    totalCents: quote.totalCents,
    netArs: arsFromCents(quote.netCents),
    vatArs: arsFromCents(quote.vatCents),
    totalArs: arsFromCents(quote.totalCents),
  } : null;

  return {
    blockId,
    checkpoint,
    phase,
    checkpointId: `${blockId}-${checkpoint}-${phase}`,
    capturedAt: new Date().toISOString(),
    source: 'GET /api/bootstrap autenticado como manager; lectura de estado, sin mutaciones',
    snapshotIdentity: { username: snapshot.user.username, role: snapshot.user.role },
    ids: {
      clientId,
      requestId: request?.id ?? workflow.requestId,
      quoteId: quote?.id ?? workflow.quoteId,
      orderId: order?.id ?? workflow.orderId,
      articleId: order?.articleId ?? quote?.articleId ?? request?.articleId ?? articleId,
      materialIds: [...materialIds],
    },
    client: client ? { id: client.id, name: client.name } : { id: clientId, name: 'Cliente Alfa' },
    product: {
      quantity: demand?.quantity ?? quantity,
      unit: demand?.unit ?? unit,
      units: order?.units ?? quote?.units ?? units,
      expectedUnits: units,
    },
    amounts: {
      expected: {
        ...expectedAmounts,
        netArs: arsFromCents(expectedAmounts.netCents),
        vatArs: arsFromCents(expectedAmounts.vatCents),
        totalArs: arsFromCents(expectedAmounts.totalCents),
      },
      quote: quoteAmounts,
      previewVerifiedInBrowser: workflow.estimateObservedInUi,
      quoteStatus: quote?.status ?? null,
    },
    request: request ? {
      id: request.id,
      clientId: request.clientId ?? null,
      articleId: request.articleId,
      quantity: request.quantity,
      unit: request.unit,
      status: request.status,
    } : null,
    quote: quote ? {
      id: quote.id,
      clientId: quote.clientId,
      articleId: quote.articleId,
      quantity: quote.quantity,
      unit: quote.unit,
      units: quote.units,
      netCents: quote.netCents,
      vatCents: quote.vatCents,
      totalCents: quote.totalCents,
      status: quote.status,
    } : null,
    order: order ? {
      id: order.id,
      number: order.number,
      quoteId: order.quoteId ?? null,
      clientId: order.clientId ?? null,
      articleId: order.articleId,
      quantity: order.quantity,
      unit: order.unit,
      units: order.units,
      producedUnits: order.producedUnits,
      status: order.status,
      machineId: order.machineId,
      priority: order.priority,
      qualityChecked: order.qualityChecked,
      requirements: (order.requirements ?? []).map((item) => ({ ...item })),
    } : null,
    stocks: stock,
    notifications: snapshot.notifications
      .filter((notice) => notice.clientId === clientId)
      .map((notice) => ({
        id: notice.id,
        clientId: notice.clientId,
        event: notice.event,
        status: notice.status,
        orderId: notice.orderId ?? null,
        quoteId: notice.quoteId ?? null,
      })),
  };
}

async function captureCheckpoint(
  blockId: string,
  checkpoint: string,
  phase: 'entrada' | 'salida',
  page: Page,
  visualRole: 'client' | 'manager' | 'admin' | 'operator',
  managerContext: BrowserContext,
  workflow: Workflow,
  apiEvents: ApiEvent[],
  checkpoints: Array<Record<string, unknown>>,
  captures: Array<Record<string, unknown>>,
  fullPage = true,
) {
  const label = `${blockId}-${checkpoint}-${phase}`;
  const snapshot = await readManagerSnapshot(managerContext, apiEvents, `Snapshot ${label}`);
  checkpoints.push(checkpointState(snapshot, workflow, blockId, checkpoint, phase));
  const filename = `${label}.png`;
  const path = join(evidenceDirectory, filename);
  await page.screenshot({ path, fullPage, animations: 'disabled' });
  captures.push({ blockId, checkpoint, phase, checkpointId: label, filename, role: visualRole, capturedAt: new Date().toISOString() });
  return snapshot;
}

test('ensayo reproducible de cinco macrobloques: cotización, abastecimiento, producción y avisos', async ({ browser }) => {
  const baseURL = configuredBaseURL();
  mkdirSync(evidenceDirectory, { recursive: true });

  const startedAt = new Date().toISOString();
  const automationStarted = process.hrtime.bigint();
  const contexts: BrowserContext[] = [];
  const preparationApi: ApiEvent[] = [];
  const apiObservations: ApiEvent[] = [];
  const uiActions: UiAction[] = [];
  const checkpoints: Array<Record<string, unknown>> = [];
  const captures: Array<Record<string, unknown>> = [];
  const workflow: Workflow = { requestId: null, quoteId: null, orderId: null, estimateObservedInUi: false };
  let managerContext: BrowserContext | undefined;

  const editorialProposal = {
    source: '/Users/argtobias/Documents/TPO - SISINFO/documentacion/diseno-video-5min.md',
    status: 'Propuesta editorial aceptada; presupuestos de diseño, no mediciones ni ensayo humano.',
    extraIntro: false,
    extraOutro: false,
    totalEditorialBudgetSeconds: 290,
    clipBudgetIncludes: ['rótulo de entrada', 'acción y voz', 'salida/transición o cierre'],
    spokenWordCounts: { B1: 84, B2: 82, B3: 78, B4: 86, B5: 83, total: 413 },
    note: 'No hay afirmación de voz, duración observada, duración de video ensayada ni aprobación humana. El rótulo, la transición y el cierre están dentro de cada clip de 58 s.',
    blocks: [
      {
        blockId: 'B1', checkpointEntry: 'C0', checkpointExit: 'C1', clip: 1,
        title: 'El cliente configura su solicitud',
        entry: 'Cliente Alfa con sesión iniciada en Mi portal; Solicitudes enviadas vacío.',
        entryTitle: '1 · Cliente Alfa pide una cotización — portal sin solicitudes',
        action: 'Nueva solicitud → ART-001 → 2 gruesas → vista previa → teléfono y consentimiento → enviar → volver a Mi portal.',
        result: 'Solicitud ART-001 · 2 gruesas · 288 unidades, Nueva; vista previa 21.600 / 4.536 / 26.136 ARS.',
        closure: 'Salida/transición de 2 s dentro del clip.',
        timingSeconds: { entryLabel: 3, actionAndVoice: 53, exit: 2, total: 58 },
        spokenWords: 84,
      },
      {
        blockId: 'B2', checkpointEntry: 'C1', checkpointExit: 'C2', clip: 2,
        title: 'El comercial lleva la cotización a pedido',
        entry: 'Rodrigo en Resumen con la solicitud Nueva de Cliente Alfa: ART-001, 2 gruesas.',
        entryTitle: '2 · Comercial: cotización y pedido — solicitud Nueva de Cliente Alfa',
        action: 'Crear con 25 % de recargo y 7 días; enviar propuesta, aceptar, convertir; abrir Pedidos y Ver orden.',
        result: 'Pedido Pendiente; reserva 400/200 g; faltan 176/88 g.',
        closure: 'Salida/transición de 2 s dentro del clip; no se muestra el portal del cliente.',
        timingSeconds: { entryLabel: 3, actionAndVoice: 53, exit: 2, total: 58 },
        spokenWords: 82,
      },
      {
        blockId: 'B3', checkpointEntry: 'C2', checkpointExit: 'C3', clip: 3,
        title: 'Abastecimiento y plan',
        entry: 'Lorena en Stock e insumos; faltantes 176 g de hilado y 88 g de alma.',
        entryTitle: '3 · Abastecimiento y plan — pedido con faltantes de 176 g y 88 g',
        action: 'Lorena ingresa 200 g INS-NEGRO y 100 g INS-ALMA; minicorte a Rodrigo para planificar M-04, prioridad 1.',
        result: 'Faltantes cero, Disponibilidad cubierta y dos movimientos; Rodrigo guarda M-04 / prioridad 1 con reserva completa.',
        closure: 'Microrrótulo Rodrigo · planificación de 1 s dentro de la ventana de acción; salida de 2 s.',
        timingSeconds: { entryLabel: 3, actionAndVoice: 53, exit: 2, total: 58 },
        spokenWords: 78,
      },
      {
        blockId: 'B4', checkpointEntry: 'C3', checkpointExit: 'C4', clip: 4,
        title: 'El operario produce y controla',
        entry: 'Operario en Cola de producción; Máquina 04 libre, pedido ART-001 de 288, Pendiente y con reserva completa.',
        entryTitle: '4 · Operario: producción y control — Máquina 04, reserva completa, stock 600 g / 300 g',
        action: 'Solo operario: abrir orden, iniciar, acumular 288 unidades, registrar QC aprobado y guardar.',
        result: 'Pedido Listo, Calidad verificada; consumo registrado de 576 g y 288 g; saldo 24/12 g.',
        closure: 'Salida/transición de 2 s dentro del clip. QC es un registro del operario, no medición automática.',
        timingSeconds: { entryLabel: 3, actionAndVoice: 53, exit: 2, total: 58 },
        spokenWords: 86,
      },
      {
        blockId: 'B5', checkpointEntry: 'C4', checkpointExit: 'C4', clip: 5,
        title: 'El cliente sigue su pedido y sus avisos',
        entry: 'Cliente Alfa con sesión en Mi portal; su pedido ART-001 ya está Listo.',
        entryTitle: '5 · Cliente Alfa: seguimiento y avisos — pedido terminado',
        action: 'Solo portal del cliente: revisar pedido Listo, 288/288, 100 %, Calidad verificada; desplazarse a Mis avisos.',
        result: 'Avisos del pedido visibles como Registrada; sin afirmar envío externo ni mostrar bandeja interna.',
        closure: 'Cierre de 6 s dentro del clip: Prototipo académico local · datos sintéticos · avisos registrados, sin envíos externos.',
        timingSeconds: { entryLabel: 3, actionAndVoice: 49, exitAndClosure: 6, total: 58 },
        spokenWords: 83,
      },
    ],
  };

  try {
    // El launcher proporciona la base demo temporal. El único reset es el endpoint autorizado del harness.
    managerContext = await newContext(browser, contexts, baseURL);
    await prepareLogin(managerContext, 'rodrigo', preparationApi);
    await recordApiEvent<{ ok: true }>(
      preparationApi,
      'preparacion-api',
      'Reiniciar la demo temporal autorizada por el harness',
      'POST',
      '/api/demo/reset',
      () => managerContext!.request.post(new URL('/api/demo/reset', baseURL).toString(), {
        headers: requestHeaders,
        data: { confirmation: 'REINICIAR DEMO' },
      }),
      (response, payload) => {
        expect(response.status(), 'El reset API autorizado debe responder 200.').toBe(200);
        expect(payload).toMatchObject({ ok: true });
      },
      'rodrigo',
    );

    const baseline = await readManagerSnapshot(managerContext, apiObservations, 'Verificar el estado semilla tras el reset API');
    expect(baseline.requests).toHaveLength(0);
    expect(baseline.notifications).toHaveLength(0);
    expect(baseline.orders).toHaveLength(2);

    const managerPage = await managerContext.newPage();
    await managerPage.goto('/#/dashboard');
    await expect(managerPage.getByRole('heading', { name: 'Buen día, Rodrigo.' })).toBeVisible();

    const clientContext = await newContext(browser, contexts, baseURL);
    await prepareLogin(clientContext, 'cliente', preparationApi);
    const clientPage = await clientContext.newPage();
    await clientPage.goto('/#/portal');
    await expect(clientPage.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();

    // B1 / C0→C1 — Cliente Alfa solicita dos gruesas de ART-001.
    await expect(clientPage.locator('.portal-requests')).toContainText('Tus nuevas solicitudes aparecerán en este listado.');
    await captureCheckpoint('B1', 'C0', 'entrada', clientPage, 'client', managerContext, workflow, apiObservations, checkpoints, captures);

    await timedUiAction(uiActions, 'B1', 'C0', 'Cliente abre Nueva solicitud desde Mi portal', async () => {
      await clientPage.getByRole('button', { name: 'Nueva solicitud' }).first().click();
      await expect(clientPage.getByRole('heading', { name: 'Empecemos por aquí' })).toBeVisible();
    });
    await timedUiAction(uiActions, 'B1', 'C0', 'Cliente elige ART-001, dos gruesas y revisa la vista previa', async () => {
      await clientPage.getByLabel('Artículo o desarrollo especial').selectOption(articleId);
      await clientPage.getByLabel('Cantidad', { exact: true }).fill(String(quantity));
      await clientPage.getByLabel('Unidad de venta').selectOption(unit);
      await expect(clientPage.locator('.estimate-values strong')).toContainText('26.136');
      await expect(clientPage.locator('.estimate-values span')).toContainText('21.600');
      await expect(clientPage.locator('.estimate-values span')).toContainText('4.536');
      await expect(clientPage.locator('.estimate-values small')).toContainText('288 unidades calculadas');
      workflow.estimateObservedInUi = true;
    });
    await timedUiAction(uiActions, 'B1', 'C0→C1', 'Cliente completa teléfono y consentimiento', async () => {
      await clientPage.getByLabel('Teléfono').fill('+54 11 5555 0101');
      await clientPage.getByRole('checkbox', { name: /Autorizo el uso de estos datos/ }).check();
    });
    await timedUiAction(uiActions, 'B1', 'C0→C1', 'Cliente envía la solicitud y vuelve al portal', async () => {
      await clientPage.getByRole('button', { name: 'Enviar solicitud' }).click();
      const success = clientPage.getByRole('status').filter({ hasText: 'registrada' });
      await expect(success).toBeVisible();
      workflow.requestId = (await success.innerText()).match(/request-[a-f\d-]+/i)?.[0] ?? null;
      expect(workflow.requestId, 'El resultado de UI debe devolver el ID de la solicitud.').toBeTruthy();
      await clientPage.getByRole('button', { name: 'Volver a mi portal', exact: true }).first().click();
      await expect(clientPage.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
      const requests = clientPage.locator('.portal-requests tbody tr');
      await expect(requests).toHaveCount(1);
      await expect(requests).toContainText('Nueva');
    });
    await captureCheckpoint('B1', 'C1', 'salida', clientPage, 'client', managerContext, workflow, apiObservations, checkpoints, captures);

    // B2 / C1→C2 — Rodrigo cotiza, envía, acepta y crea un pedido con faltantes.
    await timedUiAction(uiActions, 'B2', 'C1', 'Rodrigo actualiza el Resumen para ver la solicitud Nueva', async () => {
      await managerPage.reload();
      await expect(managerPage.getByRole('heading', { name: 'Buen día, Rodrigo.' })).toBeVisible();
      await expect(managerPage.getByRole('button', { name: 'Preparar cotización' })).toBeVisible();
    });
    await expect(managerPage.getByText('Cliente Alfa', { exact: true })).toBeVisible();
    await captureCheckpoint('B2', 'C1', 'entrada', managerPage, 'manager', managerContext, workflow, apiObservations, checkpoints, captures);

    await timedUiAction(uiActions, 'B2', 'C1', 'Rodrigo abre Preparar cotización para la solicitud Nueva', async () => {
      await managerPage.getByRole('button', { name: 'Preparar cotización' }).click();
      await expect(managerPage.getByRole('heading', { name: 'Cotizaciones', exact: true })).toBeVisible();
      await expect(managerPage.locator('.request-context-label')).toContainText(workflow.requestId!);
      await expect(managerPage.getByLabel('Cantidad')).toHaveValue(String(quantity));
      await expect(managerPage.getByLabel('Unidad')).toHaveValue(unit);
      await expect(managerPage.getByLabel('Recargo sobre costo (%)')).toHaveValue('25');
      await expect(managerPage.getByLabel('Vigencia (días)')).toHaveValue('7');
    });
    await timedUiAction(uiActions, 'B2', 'C1', 'Rodrigo crea la cotización formal', async () => {
      await managerPage.getByRole('button', { name: 'Crear cotización' }).click();
      const quoteCard = managerPage.locator('.quote-record').filter({ hasText: 'Cordón industrial' }).filter({ hasText: 'Cliente Alfa' });
      await expect(quoteCard).toBeVisible();
      await expect(quoteCard).toContainText('Recargo 25%');
      await expect(quoteCard).toContainText('26.136');
      await expect(quoteCard).toContainText('21.600');
      await expect(quoteCard).toContainText('4.536');
      await expect(quoteCard).toContainText('Borrador: el cliente todavía no la ve.');
    });

    let stateAfterQuote = await readManagerSnapshot(managerContext, apiObservations, 'Identificar la cotización creada en el snapshot del manager');
    const createdQuote = stateAfterQuote.quotes.find((item) => item.requestId === workflow.requestId);
    expect(createdQuote, 'La cotización creada debe conservar el requestId.').toBeTruthy();
    workflow.quoteId = createdQuote!.id;
    expect(createdQuote).toMatchObject({
      clientId,
      articleId,
      quantity,
      unit,
      units,
      netCents: expectedAmounts.netCents,
      vatCents: expectedAmounts.vatCents,
      totalCents: expectedAmounts.totalCents,
    });

    const quoteCard = managerPage.locator('.quote-record').filter({ hasText: 'Cordón industrial' }).filter({ hasText: 'Cliente Alfa' });
    await timedUiAction(uiActions, 'B2', 'C1', 'Rodrigo envía la propuesta', async () => {
      await quoteCard.getByRole('button', { name: 'Enviar propuesta' }).click();
      await expect(quoteCard.getByText('Enviada', { exact: true })).toBeVisible();
    });
    await timedUiAction(uiActions, 'B2', 'C1', 'Rodrigo registra la aceptación de la propuesta', async () => {
      await quoteCard.getByRole('button', { name: 'Registrar aceptación' }).click();
      await expect(quoteCard.getByText('Aceptada', { exact: true })).toBeVisible();
    });
    await timedUiAction(uiActions, 'B2', 'C1→C2', 'Rodrigo convierte la cotización aceptada en pedido', async () => {
      await quoteCard.getByRole('button', { name: 'Convertir en pedido' }).click();
      await expect(managerPage.getByText('Pedido creado; la reserva se actualizó en el inventario.')).toBeVisible();
    });
    stateAfterQuote = await readManagerSnapshot(managerContext, apiObservations, 'Identificar pedido y faltantes después de convertir la cotización');
    const createdOrder = stateAfterQuote.orders.find((item) => item.quoteId === workflow.quoteId);
    expect(createdOrder, 'La cotización aceptada debe producir un único pedido.').toBeTruthy();
    workflow.orderId = createdOrder!.id;
    expect(createdOrder).toMatchObject({ articleId, quantity, unit, units, status: 'Pendiente' });
    expect(createdOrder!.requirements?.find((item) => item.insumoId === 'INS-NEGRO')).toMatchObject({ requiredGrams: 576, reservedGrams: 400, shortageGrams: 176 });
    expect(createdOrder!.requirements?.find((item) => item.insumoId === 'INS-ALMA')).toMatchObject({ requiredGrams: 288, reservedGrams: 200, shortageGrams: 88 });

    const managerOrder = managerPage.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });
    await timedUiAction(uiActions, 'B2', 'C1→C2', 'Rodrigo abre Pedidos y el detalle de la orden con faltantes', async () => {
      await managerPage.getByRole('button', { name: 'Pedidos', exact: true }).click();
      await expect(managerPage.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
      await expect(managerOrder).toContainText('Faltante de material');
      await managerOrder.getByRole('button', { name: `Ver orden ${createdOrder!.number}`, exact: true }).click();
      const orderDialog = managerPage.getByRole('dialog');
      const negro = orderDialog.locator('.requirement-row').filter({ hasText: 'Hilado negro' });
      const alma = orderDialog.locator('.requirement-row').filter({ hasText: 'Alma negra' });
      await expect(negro).toContainText('Requerido 576 g');
      await expect(negro).toContainText('Reservado 400 g');
      await expect(negro).toContainText('Faltan 176 g');
      await expect(alma).toContainText('Requerido 288 g');
      await expect(alma).toContainText('Reservado 200 g');
      await expect(alma).toContainText('Faltan 88 g');
    });
    await captureCheckpoint('B2', 'C2', 'salida', managerPage, 'manager', managerContext, workflow, apiObservations, checkpoints, captures);

    // B3 / C2→C3 — Lorena recibe insumos y Rodrigo planifica en el minicorte.
    const adminContext = await newContext(browser, contexts, baseURL);
    await prepareLogin(adminContext, 'lorena', preparationApi);
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/#/stock');
    await expect(adminPage.getByRole('heading', { name: 'Stock e insumos', exact: true })).toBeVisible();
    await expect(adminPage.getByRole('row').filter({ hasText: 'Hilado negro' })).toContainText('176 g');
    await expect(adminPage.getByRole('row').filter({ hasText: 'Alma negra' })).toContainText('88 g');
    await expect(adminPage.getByText('264 g de faltante', { exact: true })).toBeVisible();
    await captureCheckpoint('B3', 'C2', 'entrada', adminPage, 'admin', managerContext, workflow, apiObservations, checkpoints, captures);

    await timedUiAction(uiActions, 'B3', 'C2', 'Lorena recibe 200 g de hilado negro', async () => {
      await adminPage.getByLabel('Material').selectOption('INS-NEGRO');
      await adminPage.getByLabel('Cantidad recibida (gramos)').fill('200');
      await adminPage.getByLabel('Memo del movimiento').fill('Ensayo C2 · recepción de hilado negro');
      await adminPage.getByRole('button', { name: 'Registrar ingreso' }).click();
      await expect(adminPage.getByText('Ingreso registrado y reservas pendientes recalculadas.')).toBeVisible();
    });
    await timedUiAction(uiActions, 'B3', 'C2', 'Lorena recibe 100 g de alma negra', async () => {
      await adminPage.getByLabel('Material').selectOption('INS-ALMA');
      await adminPage.getByLabel('Cantidad recibida (gramos)').fill('100');
      await adminPage.getByLabel('Memo del movimiento').fill('Ensayo C2 · recepción de alma negra');
      await adminPage.getByRole('button', { name: 'Registrar ingreso' }).click();
      await expect(adminPage.getByText('Ingreso registrado y reservas pendientes recalculadas.')).toBeVisible();
    });
    const afterReceipts = await readManagerSnapshot(managerContext, apiObservations, 'Verificar reservas y stocks después de los ingresos');
    const receivedOrder = afterReceipts.orders.find((item) => item.id === workflow.orderId);
    expect(receivedOrder?.requirements?.find((item) => item.insumoId === 'INS-NEGRO')).toMatchObject({ reservedGrams: 576, shortageGrams: 0 });
    expect(receivedOrder?.requirements?.find((item) => item.insumoId === 'INS-ALMA')).toMatchObject({ reservedGrams: 288, shortageGrams: 0 });
    expect(afterReceipts.insumos.find((item) => item.id === 'INS-NEGRO')).toMatchObject({ stockGrams: 600, reservedGrams: 576, availableGrams: 24 });
    expect(afterReceipts.insumos.find((item) => item.id === 'INS-ALMA')).toMatchObject({ stockGrams: 300, reservedGrams: 288, availableGrams: 12 });
    await expect(adminPage.getByText('Disponibilidad cubierta', { exact: true })).toBeVisible();
    await expect(adminPage.locator('.movement-table')).toContainText('Ensayo C2 · recepción de hilado negro');
    await expect(adminPage.locator('.movement-table')).toContainText('Ensayo C2 · recepción de alma negra');
    await timedUiAction(uiActions, 'B3', 'C2→C3', 'Minicorte: Rodrigo planifica M-04 con prioridad 1', async () => {
      await managerPage.reload();
      await expect(managerPage.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
      await expect(managerOrder).toContainText('Reserva completa');
      await managerOrder.getByRole('button', { name: `Ver orden ${createdOrder!.number}`, exact: true }).click();
      const dialog = managerPage.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Cordón industrial' })).toBeVisible();
      await dialog.getByLabel('Máquina').selectOption('M-04');
      await dialog.getByLabel('Prioridad (1 = más urgente)', { exact: true }).fill('1');
      await dialog.getByRole('button', { name: 'Guardar plan' }).click();
      await expect(dialog.getByText('Máquina y prioridad asignadas.')).toBeVisible();
      await expect(dialog.locator('.order-detail-summary')).toContainText('Máquina 04');
      await expect(dialog.locator('.order-detail-summary')).toContainText('1');
      await expect(dialog.getByText('Reserva completa')).toBeVisible();
    });
    const afterPlan = await readManagerSnapshot(managerContext, apiObservations, 'Verificar el plan de máquina y prioridad antes del clip de producción');
    expect(afterPlan.orders.find((item) => item.id === workflow.orderId)).toMatchObject({ status: 'Pendiente', machineId: 'M-04', priority: 1 });
    expect(afterPlan.insumos.find((item) => item.id === 'INS-NEGRO')).toMatchObject({ stockGrams: 600, shortageGrams: 0 });
    expect(afterPlan.insumos.find((item) => item.id === 'INS-ALMA')).toMatchObject({ stockGrams: 300, shortageGrams: 0 });
    await expect(managerOrder).toContainText('Máquina 04');
    await expect(managerOrder).toContainText('Prioridad 1');
    await captureCheckpoint('B3', 'C3', 'salida', managerPage, 'manager', managerContext, workflow, apiObservations, checkpoints, captures);

    // B4 / C3→C4 — En pantalla y en cámara, solo actúa el operario.
    const operatorContext = await newContext(browser, contexts, baseURL);
    await prepareLogin(operatorContext, 'operario', preparationApi);
    const operatorPage = await operatorContext.newPage();
    await operatorPage.goto('/#/cola');
    await expect(operatorPage.getByRole('heading', { name: 'Cola de producción' })).toBeVisible();
    const machineQueue = operatorPage.getByRole('region', { name: 'Máquina 04', exact: true });
    const operatorOrder = operatorPage.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });
    await expect(operatorOrder).toBeVisible();
    await expect(machineQueue.locator('.queue-position')).toHaveText(['#1']);
    await expect(machineQueue.locator('.machine-queue-meta')).toContainText('Libre');
    await expect(operatorOrder).toContainText('Reserva completa');
    await captureCheckpoint('B4', 'C3', 'entrada', operatorPage, 'operator', managerContext, workflow, apiObservations, checkpoints, captures);

    await timedUiAction(uiActions, 'B4', 'C3', 'Operario inicia la producción desde su cola', async () => {
      await operatorOrder.getByRole('button', { name: `Ver orden ${createdOrder!.number}`, exact: true }).click();
      const dialog = operatorPage.getByRole('dialog');
      await expect(dialog.locator('.order-detail-summary')).toContainText('Máquina 04');
      await dialog.getByRole('button', { name: 'Iniciar producción' }).click();
      await expect(dialog.getByText('Producción iniciada con la reserva de materiales validada.')).toBeVisible();
    });
    await timedUiAction(uiActions, 'B4', 'C3→C4', 'Operario registra 288 unidades y aprueba control de calidad', async () => {
      const dialog = operatorPage.getByRole('dialog');
      await dialog.getByLabel('Unidades acumuladas · 288 total').fill(String(units));
      const qualityCheck = dialog.getByRole('checkbox', { name: /Control de calidad aprobado/ });
      await expect(qualityCheck).toBeEnabled();
      await qualityCheck.check();
      await dialog.getByRole('button', { name: 'Guardar avance' }).click();
      await expect(dialog.getByText('Listo', { exact: true })).toBeVisible();
      const requirements = dialog.locator('.requirements-list');
      await expect(requirements).toContainText('Consumido 576 g');
      await expect(requirements).toContainText('Consumido 288 g');
      await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
      await expect(operatorOrder).toContainText('Listo');
      await expect(operatorOrder).toContainText('Calidad verificada');
      await expect(operatorOrder).toContainText('288 fabricadas');
      await expect(machineQueue.locator('.machine-queue-meta')).toContainText('Libre');
    });

    const afterProduction = await readManagerSnapshot(managerContext, apiObservations, 'Verificar producción, QC y saldo físico final');
    expect(afterProduction.orders.find((item) => item.id === workflow.orderId)).toMatchObject({
      status: 'Listo', producedUnits: units, qualityChecked: true, machineId: 'M-04', priority: 1,
    });
    expect(afterProduction.insumos.find((item) => item.id === 'INS-NEGRO')).toMatchObject({ stockGrams: 24, belowMinimum: true });
    expect(afterProduction.insumos.find((item) => item.id === 'INS-ALMA')).toMatchObject({ stockGrams: 12, belowMinimum: true });
    await captureCheckpoint('B4', 'C4', 'salida', operatorPage, 'operator', managerContext, workflow, apiObservations, checkpoints, captures);

    // B5 / C4 — Solo el portal del cliente; no se abre la bandeja interna.
    await timedUiAction(uiActions, 'B5', 'C4', 'Cliente vuelve a Mi portal y comprueba el pedido Listo', async () => {
      await clientPage.reload();
      await expect(clientPage.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
      const portalOrder = clientPage.locator('.portal-order-row').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '288 / 288 unidades' });
      await expect(portalOrder).toContainText('288 / 288 unidades');
      await expect(portalOrder).toContainText('Listo');
      await expect(portalOrder).toContainText('Calidad verificada');
    });
    await captureCheckpoint('B5', 'C4', 'entrada', clientPage, 'client', managerContext, workflow, apiObservations, checkpoints, captures);

    await timedUiAction(uiActions, 'B5', 'C4', 'Cliente desplaza el portal a Mis avisos y revisa los eventos registrados', async () => {
      await clientPage.locator('.portal-notifications').scrollIntoViewIfNeeded();
      await expect(clientPage.getByRole('heading', { name: 'Mis avisos' })).toBeVisible();
      const portalNotices = clientPage.locator('.portal-notice-row');
      await expect(portalNotices).toHaveCount(3);
      for (const event of ['Cotización enviada', 'En producción', 'Listo']) {
        const notice = portalNotices.filter({ hasText: event });
        await expect(notice).toHaveCount(1);
        await expect(notice).toContainText('Registrada');
      }
      await expect(portalNotices.filter({ hasText: 'Listo' })).toHaveCount(1);
      await expect(clientPage.locator('.portal-notification-note')).toContainText('no confirma que se haya enviado un correo');
    });
    await captureCheckpoint('B5', 'C4', 'salida', clientPage, 'client', managerContext, workflow, apiObservations, checkpoints, captures, false);
  } finally {
    const closeResults = await Promise.allSettled(contexts.map((context) => context.close()));
    const cleanupErrors = closeResults.flatMap((result) => result.status === 'rejected' ? [errorMessage(result.reason)] : []);
    const report = {
      schemaVersion: 1,
      scenario: 'Cinco clips B1-B5 del diseno-video-5min.md; flujo UI automatizado sobre la base temporal del launcher.',
      execution: {
        startedAt,
        generatedAt: new Date().toISOString(),
        playwrightStatus: test.info().status ?? 'desconocido',
        automationElapsedMs: Number(process.hrtime.bigint() - automationStarted) / 1_000_000,
        elapsedTimeMeaning: 'Tiempo de ejecución de Playwright, no ensayo humano, no duración de video y no duración de voz.',
        cleanupErrors,
      },
      reset: {
        method: 'POST /api/demo/reset',
        authorization: 'Sesión manager rodrigo creada por API; confirmación REINICIAR DEMO; base demo temporal del launcher.',
        databaseAccess: 'Solo endpoints normales; sin SQL ni acceso directo a SQLite.',
      },
      editorialProposal,
      preparationApi,
      apiObservations,
      browserUiActions: uiActions,
      checkpoints,
      captures,
      dataModel: {
        monetaryUnit: 'ARS; cents son enteros y ARS es una cadena decimal sin separador regional.',
        amountMeaning: 'La vista previa se afirma solo al quedar verificada en UI; la cotización formal proviene del snapshot del API.',
        blockAndCheckpoint: 'B1-B5 identifican los cinco clips; C0-C4 son checkpoints de estado y nunca sustituyen el ID de bloque.',
        captureNaming: 'Cada captura usa bloque, checkpoint y fase: B1-C0-entrada.png, ..., B5-C4-salida.png.',
        clipDurationsSeconds: editorialProposal.blocks.map((block) => ({ blockId: block.blockId, seconds: block.timingSeconds.total })),
        voiceWordCounts: editorialProposal.spokenWordCounts,
        clipRoles: { B3: ['admin', 'manager minicorte'], B4: ['operator solamente'], B5: ['client portal solamente'] },
      },
    };
    writeFileSync(join(evidenceDirectory, 'rehearsal.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
});
