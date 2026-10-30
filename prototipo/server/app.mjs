import express from 'express';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dayString, inTransaction, isDemoDatabase, nowIso, openDatabase, plusDays, resetDemoDatabase } from './db.mjs';

const COOKIE_NAME = 'jacsa_sid';
const SESSION_DAYS = 7;
const MAX_UNITS = 1_000_000;
const MAX_STOCK_GRAMS = 1_000_000_000_000;
const UNIT_FACTORS = Object.freeze({ unidad: 1, gruesa: 144, '100pares': 200 });
const dummyHash = scryptSync('invalid-login', randomBytes(16), 64);
const appDirectory = dirname(fileURLToPath(import.meta.url));
const distDirectory = join(appDirectory, '..', 'dist');
const distIndex = join(distDirectory, 'index.html');

class ApiError extends Error {
  constructor(status, error, code) {
    super(error);
    this.status = status;
    this.code = code;
  }
}

function fail(status, message, code) {
  throw new ApiError(status, message, code);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireBody(req) {
  if (!isPlainObject(req.body)) fail(400, 'El cuerpo debe ser un objeto JSON', 'INVALID_BODY');
  return req.body;
}

function text(value, label, { max = 500, min = 1, optional = false, allowMarkup = false } = {}) {
  if (optional && (value === undefined || value === null)) return '';
  if (typeof value !== 'string') fail(400, `${label} debe ser texto`, 'INVALID_INPUT');
  const normalized = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (!allowMarkup && /[<>]/.test(normalized)) fail(400, `${label} no puede contener marcado HTML`, 'INVALID_INPUT');
  if (normalized.length < min || normalized.length > max) {
    fail(400, `${label} debe tener entre ${min} y ${max} caracteres`, 'INVALID_INPUT');
  }
  return normalized;
}

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    fail(400, `${label} debe ser un entero entre ${min} y ${max}`, 'INVALID_INPUT');
  }
  return value;
}

function finiteNumber(value, label, { min = 0, max = 500 } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(400, `${label} debe ser un número entre ${min} y ${max}`, 'INVALID_INPUT');
  }
  return value;
}

function boolean(value, label) {
  if (typeof value !== 'boolean') fail(400, `${label} debe ser verdadero o falso`, 'INVALID_INPUT');
  return value;
}

function enumValue(value, label, options) {
  if (typeof value !== 'string' || !options.includes(value)) {
    fail(400, `${label} no es válido`, 'INVALID_INPUT');
  }
  return value;
}

function dateOnly(value, label, { notPast = false } = {}) {
  const validFormat = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = validFormat ? new Date(`${value}T00:00:00.000Z`) : new Date(Number.NaN);
  if (!validFormat || Number.isNaN(date.valueOf()) || dayString(date) !== value) {
    fail(400, `${label} debe tener formato YYYY-MM-DD`, 'INVALID_DATE');
  }
  if (notPast && value < dayString()) fail(400, `${label} no puede ser anterior a hoy`, 'INVALID_DATE');
  return value;
}

function idText(value, label) {
  return text(value, label, { max: 80 });
}

function safeCents(value) {
  if (!Number.isSafeInteger(value) || value < 0) fail(400, 'El importe excede el límite permitido', 'AMOUNT_LIMIT');
  return value;
}

function unitCount(quantity, unit) {
  const count = quantity * UNIT_FACTORS[unit];
  if (!Number.isSafeInteger(count) || count > MAX_UNITS) {
    fail(400, `La cantidad no puede superar ${MAX_UNITS} unidades`, 'QUANTITY_LIMIT');
  }
  return count;
}

function parseQuantity(body) {
  const quantity = integer(body.quantity, 'quantity', { min: 1, max: 1_000_000 });
  const unit = enumValue(body.unit, 'unit', Object.keys(UNIT_FACTORS));
  return { quantity, unit, units: unitCount(quantity, unit) };
}

function markupBasisPoints(percent) {
  return Math.round(percent * 100);
}

function netFor(costCents, units, markupPercent) {
  const factor = BigInt(10_000 + markupBasisPoints(markupPercent));
  const numerator = BigInt(costCents) * BigInt(units) * factor;
  return safeCents(Number((numerator + 5_000n) / 10_000n));
}

function centsForGrams(priceCentsPerKg, grams) {
  const value = (BigInt(priceCentsPerKg) * BigInt(grams) + 500n) / 1_000n;
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) fail(400, 'El costo del artículo excede el límite permitido', 'AMOUNT_LIMIT');
  return Number(value);
}

function vatFor(netCents) {
  return safeCents(Number((BigInt(netCents) * 21n + 50n) / 100n));
}

function validCuit(value) {
  if (typeof value !== 'string' || !/^(?:\d{11}|\d{2}-\d{8}-\d)$/.test(value)) return null;
  const digits = value.replaceAll('-', '');
  if (!new Set(['20', '23', '24', '27', '30', '33', '34']).has(digits.slice(0, 2))) return null;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  const remainder = sum % 11;
  const check = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  return Number(digits[10]) === check ? digits : null;
}

function reservedGrams(db, insumoId) {
  return db.prepare('SELECT COALESCE(SUM(reserved_grams), 0) AS total FROM order_requirements WHERE insumo_id = ?')
    .get(insumoId).total;
}

function articleData(db, articleId) {
  const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
  if (!row) return null;
  const bom = db.prepare(`SELECT b.insumo_id, b.grams_per_unit, i.price_cents_per_kg, i.price_date
    FROM article_bom b JOIN insumos i ON i.id = b.insumo_id WHERE b.article_id = ? ORDER BY b.insumo_id`).all(articleId);
  if (bom.length === 0) fail(409, 'El artículo no tiene una lista de materiales configurada', 'ARTICLE_NOT_CONFIGURED');
  let costCents = row.machine_cost_cents + row.other_cost_cents;
  for (const item of bom) costCents += centsForGrams(item.price_cents_per_kg, item.grams_per_unit);
  safeCents(costCents);
  const staleBefore = new Date();
  staleBefore.setUTCHours(0, 0, 0, 0);
  staleBefore.setUTCDate(staleBefore.getUTCDate() - 15);
  const stale = bom.some((item) => item.price_date < dayString(staleBefore));
  const machineIds = db.prepare('SELECT machine_id FROM article_machines WHERE article_id = ? ORDER BY machine_id')
    .all(articleId).map((item) => item.machine_id);
  return { row, bom, costCents, stale, machineIds };
}

function publicArticle(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    material: row.material,
    color: row.color,
    threads: row.threads,
    lengthCm: row.length_cm,
    weave: row.weave,
    unit: row.unit,
    public: true,
  };
}

function articleSnapshot(db, row, role) {
  const data = articleData(db, row.id);
  const base = publicArticle(row);
  if (role === 'client' || role === 'technology') {
    if (role === 'technology') return base;
    return data.stale ? base : { ...base, priceCents: netFor(data.costCents, 1, 25) };
  }
  const result = {
    ...base,
    public: row.published === 1,
    stale: data.stale,
    bom: data.bom.map((item) => ({ insumoId: item.insumo_id, gramsPerUnit: item.grams_per_unit })),
    machineIds: data.machineIds,
  };
  if (role !== 'operator') {
    result.costCents = data.costCents;
    result.priceCents = netFor(data.costCents, 1, 25);
  }
  return result;
}

function userShape(row) {
  if (!row) return null;
  const user = { id: row.id, name: row.name, username: row.username, role: row.role };
  if (row.client_id) user.clientId = row.client_id;
  return user;
}

function cookieToken(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  const values = header.split(';').map((part) => part.trim()).filter((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (values.length !== 1) return null;
  const token = values[0].slice(COOKIE_NAME.length + 1);
  return /^[a-f\d]{64}$/.test(token) ? token : null;
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function cookieOptions() {
  return { httpOnly: true, sameSite: 'strict', path: '/', maxAge: SESSION_DAYS * 24 * 60 * 60 * 1_000 };
}

function loadSession(db, token) {
  if (!token) return null;
  const hash = tokenHash(token);
  const session = db.prepare(`SELECT s.token_hash, s.expires_at, u.*
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`).get(hash);
  if (!session) return null;
  if (session.expires_at <= nowIso() || session.enabled !== 1) return null;
  return { hash, user: userShape(session) };
}

function addHistory(db, orderId, user, action) {
  db.prepare('INSERT INTO order_history (order_id, at, by_user, action) VALUES (?, ?, ?, ?)')
    .run(orderId, nowIso(), user.id, action);
}

function currentQuoteStatus(quote) {
  if (['Pendiente', 'Enviada', 'Aceptada'].includes(quote.status) && quote.expires_at <= nowIso()) return 'Vencida';
  return quote.status;
}

function nextNumber(db, table, prefix) {
  const count = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count + 1;
  return `${prefix}-${String(count).padStart(6, '0')}`;
}

function requirementShortage(row) {
  return Math.max(0, row.required_grams - row.reserved_grams - row.consumed_grams);
}

function allocateAvailableStock(db, insumoId) {
  const stock = db.prepare('SELECT stock_grams FROM insumos WHERE id = ?').get(insumoId);
  let available = stock.stock_grams - reservedGrams(db, insumoId);
  if (available <= 0) return;
  const shortages = db.prepare(`SELECT r.order_id, r.required_grams, r.reserved_grams, r.consumed_grams
    FROM order_requirements r JOIN orders o ON o.id = r.order_id
    WHERE r.insumo_id = ? AND o.status IN ('Pendiente','En producción')
    ORDER BY o.created_at, o.id`).all(insumoId);
  const update = db.prepare('UPDATE order_requirements SET reserved_grams = reserved_grams + ? WHERE order_id = ? AND insumo_id = ?');
  for (const row of shortages) {
    const amount = Math.min(available, requirementShortage(row));
    if (amount > 0) {
      update.run(amount, row.order_id, insumoId);
      available -= amount;
    }
    if (available === 0) break;
  }
}

function notificationDelivery(recipient) {
  const normalizedRecipient = typeof recipient === 'string' ? recipient.trim() : '';
  return {
    recipient: normalizedRecipient,
    status: normalizedRecipient ? 'Registrada' : 'Pendiente de reintento',
  };
}

function addNotification(db, { orderId = null, quoteId = null, clientId, event, recipient, subject, body }) {
  const notificationId = `notification-${randomUUID()}`;
  const delivery = notificationDelivery(recipient);
  db.prepare(`INSERT INTO notifications
    (id, order_id, quote_id, client_id, event, recipient, channel, status, subject, body, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Email', ?, ?, ?, ?)`)
    .run(notificationId, orderId, quoteId, clientId, event, delivery.recipient, delivery.status, subject, body, nowIso());
  return notificationId;
}

function notifyOrder(db, orderId, event) {
  const order = db.prepare(`SELECT o.id, o.number, o.due_date, o.client_id, c.email,
      a.code AS article_code, a.name AS article_name
    FROM orders o JOIN clients c ON c.id = o.client_id
    JOIN articles a ON a.id = o.article_id WHERE o.id = ?`).get(orderId);
  if (!order) fail(404, 'No se encontró el pedido para registrar el aviso', 'ORDER_NOT_FOUND');
  const subject = `${order.number} — ${order.article_code} ${order.article_name} — ${event} — entrega ${order.due_date}`;
  const body = `El pedido ${order.number} del artículo ${order.article_code} ${order.article_name} cambió al estado ${event}. Fecha de entrega: ${order.due_date}.`;
  return addNotification(db, {
    orderId,
    clientId: order.client_id,
    event,
    recipient: order.email,
    subject,
    body,
  });
}

function requestUser(req, res, next, db, allowedRoles = null) {
  try {
    const session = loadSession(db, cookieToken(req));
    if (!session) {
      res.clearCookie(COOKIE_NAME, cookieOptions());
      fail(401, 'Inicie sesión para continuar', 'UNAUTHENTICATED');
    }
    req.user = session.user;
    req.sessionHash = session.hash;
    if (allowedRoles && !allowedRoles.includes(req.user.role)) fail(403, 'No tiene permiso para esta operación', 'FORBIDDEN');
    next();
  } catch (error) {
    sendError(res, error);
  }
}

function sendError(res, error) {
  if (res.headersSent) return;
  if (error instanceof ApiError) {
    const payload = { error: error.message };
    if (error.code) payload.code = error.code;
    res.status(error.status).json(payload);
    return;
  }
  if (error?.type === 'entity.too.large') {
    res.status(400).json({ error: 'El cuerpo de la solicitud supera el límite permitido', code: 'REQUEST_TOO_LARGE' });
    return;
  }
  if (error?.type === 'entity.parse.failed' || error?.status === 400) {
    res.status(400).json({ error: 'La solicitud JSON no es válida', code: 'INVALID_JSON' });
    return;
  }
  if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || error?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
    res.status(409).json({ error: 'El registro ya existe o la operación entra en conflicto', code: 'CONFLICT' });
    return;
  }
  res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL_ERROR' });
}

function route(handler) {
  return (req, res) => {
    try {
      const result = handler(req, res);
      if (!res.headersSent && result !== undefined) {
        const status = result?.status ?? 200;
        const payload = result?.body ?? result;
        res.status(status).json(payload);
      }
    } catch (error) {
      sendError(res, error);
    }
  };
}

function validateOrigin(req) {
  const origin = req.get('Origin');
  if (!origin) return;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    fail(403, 'Origen no permitido', 'INVALID_ORIGIN');
  }
  if (parsed.origin === 'null' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    fail(403, 'Origen no permitido', 'INVALID_ORIGIN');
  }
  const host = req.get('host');
  const requestOrigin = `${req.protocol}://${host}`;
  if (parsed.origin === requestOrigin) return;
  const loopback = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
  if (parsed.protocol === 'http:' && parsed.port === '5173' && loopback.has(parsed.hostname) && loopback.has(host.split(':')[0])) return;
  fail(403, 'Origen no permitido', 'INVALID_ORIGIN');
}

function snapshotUser(db, user) {
  return userShape(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id));
}

function snapshot(db, user) {
  const role = user.role;
  const allArticles = db.prepare('SELECT * FROM articles ORDER BY id').all();
  const visibleArticles = role === 'client' || role === 'technology'
    ? allArticles.filter((article) => article.published === 1)
    : allArticles;
  const articles = visibleArticles.map((article) => articleSnapshot(db, article, role));
  const own = (sql, args = []) => db.prepare(sql).all(...args);
  let clients = [];
  if (['manager', 'admin'].includes(role)) {
    clients = own('SELECT * FROM clients ORDER BY name').map((row) => ({ id: row.id, name: row.name, email: row.email, cuit: row.cuit }));
  } else if (role === 'client') {
    const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(user.clientId);
    if (row) clients = [{ id: row.id, name: row.name, email: row.email, cuit: row.cuit }];
  }

  let requests = [];
  if (['manager', 'admin'].includes(role)) {
    requests = own('SELECT * FROM requests ORDER BY created_at DESC').map(mapRequest);
  } else if (role === 'client') {
    requests = own('SELECT * FROM requests WHERE client_id = ? ORDER BY created_at DESC', [user.clientId]).map(mapRequest);
  }

  let quotes = [];
  if (['manager', 'admin'].includes(role)) {
    quotes = own('SELECT * FROM quotes ORDER BY created_at DESC').map((row) => mapQuote(row, true));
  } else if (role === 'client') {
    quotes = own("SELECT * FROM quotes WHERE client_id = ? AND status <> 'Pendiente' ORDER BY created_at DESC", [user.clientId])
      .map((row) => mapQuote(row, false));
  }

  let orders = [];
  if (['manager', 'admin'].includes(role)) {
    orders = own('SELECT * FROM orders ORDER BY created_at DESC').map((row) => mapOrder(db, row, role));
  } else if (role === 'operator') {
    orders = own('SELECT * FROM orders ORDER BY created_at DESC').map((row) => mapOrder(db, row, role));
  } else if (role === 'client') {
    orders = own('SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC', [user.clientId]).map((row) => mapOrder(db, row, role));
  }

  let insumos = [];
  if (['manager', 'admin', 'operator'].includes(role)) {
    insumos = own('SELECT * FROM insumos ORDER BY id').map((row) => mapInsumo(db, row, role));
  }

  let machines = [];
  if (['manager', 'admin', 'operator'].includes(role)) {
    machines = own('SELECT * FROM machines ORDER BY id').map((row) => ({
      id: row.id,
      name: row.name,
      maxThreads: row.max_threads,
      activeOrderId: db.prepare("SELECT id FROM orders WHERE machine_id = ? AND status = 'En producción' LIMIT 1").get(row.id)?.id ?? null,
    }));
  }

  let notifications = [];
  if (['manager', 'admin'].includes(role)) {
    notifications = own('SELECT * FROM notifications ORDER BY created_at DESC').map(mapNotification);
  } else if (role === 'client') {
    notifications = own('SELECT * FROM notifications WHERE client_id = ? ORDER BY created_at DESC', [user.clientId]).map(mapNotification);
  }

  const movements = ['manager', 'admin'].includes(role)
    ? own('SELECT * FROM movements ORDER BY created_at DESC').map(mapMovement)
    : [];
  const result = {
    user: snapshotUser(db, user),
    articles,
    clients,
    requests,
    quotes,
    orders,
    insumos,
    machines,
    notifications,
    movements,
    settings: { markupPercent: 25, validDays: 7, staleDays: 15 },
  };
  if (role === 'technology') {
    result.users = own('SELECT id, name, username, role, client_id, enabled FROM users ORDER BY username')
      .map((row) => ({ ...userShape(row), enabled: row.enabled === 1 }));
  }
  return result;
}

function mapRequest(row) {
  const result = {
    id: row.id,
    articleId: row.article_id,
    quantity: row.quantity,
    unit: row.unit,
    special: row.special === 1,
    notes: row.notes,
    company: row.company,
    cuit: row.cuit,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
  };
  if (row.client_id) result.clientId = row.client_id;
  return result;
}

function mapQuote(row, showMarkup) {
  const result = {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    articleId: row.article_id,
    quantity: row.quantity,
    unit: row.unit,
    units: row.units,
    validDays: row.valid_days,
    netCents: row.net_cents,
    vatCents: row.vat_cents,
    totalCents: row.total_cents,
    status: currentQuoteStatus(row),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
  if (row.request_id) result.requestId = row.request_id;
  if (showMarkup) result.markupPercent = row.markup_percent;
  if (showMarkup && row.stale_accepted === 1) result.staleAccepted = true;
  return result;
}

function mapOrder(db, row, role) {
  const histories = db.prepare('SELECT at, by_user, action FROM order_history WHERE order_id = ? ORDER BY id').all(row.id);
  const result = {
    id: row.id,
    number: row.number,
    articleId: row.article_id,
    quantity: row.quantity,
    unit: row.unit,
    units: row.units,
    producedUnits: row.produced_units,
    status: row.status,
    dueDate: row.due_date,
    priority: row.priority,
    machineId: row.machine_id,
    qualityChecked: row.quality_checked === 1,
    createdAt: row.created_at,
    history: histories.map((item) => {
      const entry = { at: item.at, action: item.action };
      if (role !== 'client') entry.by = item.by_user;
      return entry;
    }),
  };
  if (role !== 'client') {
    result.delayed = row.due_date < dayString() && ['Pendiente', 'En producción', 'Listo'].includes(row.status);
  }
  if (role !== 'operator') {
    result.quoteId = row.quote_id;
    result.clientId = row.client_id;
  }
  if (role !== 'client') {
    result.requirements = db.prepare(`SELECT insumo_id, required_grams, reserved_grams, consumed_grams
      FROM order_requirements WHERE order_id = ? ORDER BY insumo_id`).all(row.id).map((requirement) => ({
      insumoId: requirement.insumo_id,
      requiredGrams: requirement.required_grams,
      reservedGrams: requirement.reserved_grams,
      consumedGrams: requirement.consumed_grams,
      shortageGrams: requirementShortage(requirement),
    }));
  }
  return result;
}

function mapInsumo(db, row, role) {
  const reserved = reservedGrams(db, row.id);
  const demand = db.prepare(`SELECT COALESCE(SUM(r.required_grams - r.consumed_grams), 0) AS required,
      COALESCE(SUM(MAX(0, r.required_grams - r.reserved_grams - r.consumed_grams)), 0) AS shortage
    FROM order_requirements r JOIN orders o ON o.id = r.order_id
    WHERE r.insumo_id = ? AND o.status IN ('Pendiente','En producción')`).get(row.id);
  const result = {
    id: row.id,
    name: row.name,
    color: row.color,
    stockGrams: row.stock_grams,
    reservedGrams: reserved,
    availableGrams: row.stock_grams - reserved,
    minGrams: row.minimum_grams,
    belowMinimum: row.stock_grams < row.minimum_grams,
    requiredGrams: demand.required,
    shortageGrams: demand.shortage,
  };
  if (role !== 'operator') {
    result.priceCentsPerKg = row.price_cents_per_kg;
    result.priceDate = row.price_date;
  }
  return result;
}

function mapNotification(row) {
  const result = {
    id: row.id,
    clientId: row.client_id,
    event: row.event,
    recipient: row.recipient,
    channel: row.channel,
    status: row.status,
    subject: row.subject,
    body: row.body,
    createdAt: row.created_at,
  };
  if (row.order_id) result.orderId = row.order_id;
  if (row.quote_id) result.quoteId = row.quote_id;
  return result;
}

function mapMovement(row) {
  const result = {
    id: row.id,
    insumoId: row.insumo_id,
    grams: row.grams,
    type: row.type,
    memo: row.memo,
    createdAt: row.created_at,
  };
  if (row.order_id) result.orderId = row.order_id;
  return result;
}

export function createApp({ dbPath = process.env.JACSA_DB ?? join(appDirectory, '..', 'data', 'jacsa.sqlite'), demoMode = process.env.JACSA_DEMO === '1' } = {}) {
  const db = openDatabase(dbPath);
  const app = express();
  let closed = false;
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'no-referrer');
    next();
  });
  app.use(express.json({ limit: '64kb', strict: true }));
  app.use('/api', (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    try {
      if (req.get('X-Jacsa-Request') !== '1') fail(403, 'Falta la cabecera de solicitud válida', 'REQUEST_HEADER_REQUIRED');
      validateOrigin(req);
      if (!req.is('application/json')) fail(400, 'Se requiere Content-Type application/json', 'JSON_REQUIRED');
      next();
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get('/api/health', route(() => ({ ok: true })));
  app.get('/api/me', route((req, res) => {
    const session = loadSession(db, cookieToken(req));
    if (!session) {
      res.clearCookie(COOKIE_NAME, cookieOptions());
      return { user: null };
    }
    return { user: session.user };
  }));
  app.get('/api/catalog', route(() => ({
    articles: db.prepare('SELECT * FROM articles WHERE published = 1 ORDER BY id').all().map(publicArticle),
  })));

  app.post('/api/login', route((req, res) => {
    const body = requireBody(req);
    const username = text(body.username, 'username', { max: 80 }).toLowerCase();
    const password = text(body.password, 'password', { max: 1_024, allowMarkup: true });
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    const salt = row?.password_salt ? Buffer.from(row.password_salt, 'hex') : randomBytes(16);
    const expected = row?.password_hash ? Buffer.from(row.password_hash, 'hex') : dummyHash;
    const actual = scryptSync(password, salt, expected.length);
    if (!row || row.enabled !== 1 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      fail(401, 'Usuario o contraseña incorrectos', 'INVALID_CREDENTIALS');
    }
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = plusDays(now, SESSION_DAYS).toISOString();
    inTransaction(db, () => {
      db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now.toISOString());
      db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(tokenHash(token), row.id, expiresAt, now.toISOString());
    });
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return { user: userShape(row) };
  }));

  app.post('/api/logout', route((req, res) => {
    const token = cookieToken(req);
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return { ok: true };
  }));

  app.post('/api/estimate', route((req) => {
    const body = requireBody(req);
    const { units } = parseQuantity(body);
    const session = loadSession(db, cookieToken(req));
    if (session && ['operator', 'technology'].includes(session.user.role)) {
      fail(403, 'No tiene permiso para consultar precios comerciales', 'FORBIDDEN');
    }
    const special = body.special === undefined ? false : boolean(body.special, 'special');
    const articleId = body.articleId === null && special ? '' : idText(body.articleId, 'articleId');
    const data = articleId ? articleData(db, articleId) : null;
    if (special) return { available: false, reason: 'El artículo requiere una cotización especial', units };
    if (!data || data.row.published !== 1) return { available: false, reason: 'No hay un precio configurado para este artículo', units };
    if (data.stale) return { available: false, reason: 'El precio de los insumos requiere actualización', units };
    const netCents = netFor(data.costCents, units, 25);
    const vatCents = vatFor(netCents);
    return { available: true, units, netCents, vatCents, totalCents: safeCents(netCents + vatCents) };
  }));

  app.post('/api/requests', route((req) => {
    const body = requireBody(req);
    const { quantity, unit } = parseQuantity(body);
    const special = boolean(body.special, 'special');
    let articleId = body.articleId === null ? null : idText(body.articleId, 'articleId');
    if (!special && (!articleId || !db.prepare('SELECT id FROM articles WHERE id = ? AND published = 1').get(articleId))) {
      fail(400, 'Seleccione un artículo público o marque la solicitud como especial', 'INVALID_ARTICLE');
    }
    const consent = boolean(body.consent, 'consent');
    if (!consent) fail(400, 'Se requiere consentimiento para continuar', 'CONSENT_REQUIRED');
    const company = text(body.company, 'company', { max: 120 });
    const cuit = validCuit(text(body.cuit, 'cuit', { max: 16 }));
    if (!cuit) fail(400, 'El CUIT no es válido', 'INVALID_CUIT');
    const email = text(body.email, 'email', { max: 254 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'El email no es válido', 'INVALID_EMAIL');
    const phone = text(body.phone, 'phone', { max: 30 });
    if (!/^[+\d ()-]{7,30}$/.test(phone) || phone.replace(/\D/g, '').length < 7) fail(400, 'El teléfono no es válido', 'INVALID_PHONE');
    const notes = text(body.notes ?? '', 'notes', { max: 1_000, min: 0, optional: true });
    const session = loadSession(db, cookieToken(req));
    const clientId = session?.user.role === 'client' ? session.user.clientId : null;
    const id = `request-${randomUUID()}`;
    db.prepare(`INSERT INTO requests
      (id, client_id, article_id, quantity, unit, special, notes, company, cuit, email, phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Nueva', ?)`)
      .run(id, clientId ?? null, articleId, quantity, unit, special ? 1 : 0, notes, company, cuit, email, phone, nowIso());
    return { status: 201, body: { ok: true, id } };
  }));

  app.get('/api/bootstrap', (req, res, next) => requestUser(req, res, next, db), route((req) => snapshot(db, req.user)));

  app.post('/api/quotes', (req, res, next) => requestUser(req, res, next, db, ['manager']), route((req) => {
    const body = requireBody(req);
    const clientId = idText(body.clientId, 'clientId');
    const articleId = idText(body.articleId, 'articleId');
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) fail(404, 'No se encontró el cliente', 'CLIENT_NOT_FOUND');
    const data = articleData(db, articleId);
    if (!data) fail(404, 'No se encontró el artículo', 'ARTICLE_NOT_FOUND');
    const { quantity, unit, units } = parseQuantity(body);
    const markupPercent = finiteNumber(body.markupPercent, 'markupPercent', { min: 0, max: 500 });
    const validDays = integer(body.validDays, 'validDays', { min: 1, max: 365 });
    const allowStale = body.allowStale === undefined ? false : boolean(body.allowStale, 'allowStale');
    if (data.stale && !allowStale) fail(409, 'Confirme el uso del precio vencido para continuar', 'STALE_PRICE');
    const requestId = body.requestId === undefined ? null : idText(body.requestId, 'requestId');
    const netCents = netFor(data.costCents, units, markupPercent);
    const vatCents = vatFor(netCents);
    const totalCents = safeCents(netCents + vatCents);
    const id = `quote-${randomUUID()}`;
    const number = nextNumber(db, 'quotes', 'COT');
    const createdAt = nowIso();
    const expiresAt = plusDays(new Date(createdAt), validDays).toISOString();
    inTransaction(db, () => {
      const request = requestId ? db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId) : null;
      if (requestId && !request) fail(404, 'No se encontró la solicitud', 'REQUEST_NOT_FOUND');
      if (request && request.status !== 'Nueva') fail(409, 'La solicitud ya fue cotizada', 'REQUEST_ALREADY_QUOTED');
      if (request && request.client_id !== null && request.client_id !== clientId) {
        fail(403, 'La solicitud pertenece a otro cliente', 'CLIENT_MISMATCH');
      }
      db.prepare(`INSERT INTO quotes
        (id, number, request_id, client_id, article_id, quantity, unit, units, markup_percent, valid_days,
         net_cents, vat_cents, total_cents, status, stale_accepted, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)`)
        .run(id, number, requestId, clientId, articleId, quantity, unit, units, markupPercent, validDays,
          netCents, vatCents, totalCents, data.stale ? 1 : 0, createdAt, expiresAt);
      if (requestId && request.client_id === null) {
        db.prepare("UPDATE requests SET client_id = ?, status = 'Cotizada' WHERE id = ?").run(clientId, requestId);
      } else if (requestId) {
        db.prepare("UPDATE requests SET status = 'Cotizada' WHERE id = ?").run(requestId);
      }
    });
    return { status: 201, body: { ok: true, id } };
  }));

  app.post('/api/quotes/:id/send', (req, res, next) => requestUser(req, res, next, db, ['manager']), route((req) => {
    const quoteId = idText(req.params.id, 'id');
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
    if (!quote) fail(404, 'No se encontró la cotización', 'QUOTE_NOT_FOUND');
    if (quote.status !== 'Pendiente') fail(409, 'La cotización no está pendiente', 'INVALID_QUOTE_STATE');
    if (quote.expires_at <= nowIso()) fail(409, 'La cotización ya venció', 'QUOTE_EXPIRED');
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(quote.client_id);
    inTransaction(db, () => {
      db.prepare("UPDATE quotes SET status = 'Enviada' WHERE id = ?").run(quoteId);
      addNotification(db, {
        quoteId,
        clientId: client.id,
        event: 'Cotización enviada',
        recipient: client.email,
        subject: `Cotización ${quote.number}`,
        body: `La cotización ${quote.number} está disponible para su revisión.`,
      });
    });
    return { ok: true, id: quoteId };
  }));

  app.post('/api/quotes/:id/accept', (req, res, next) => requestUser(req, res, next, db, ['manager']), route((req) => {
    const quoteId = idText(req.params.id, 'id');
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
    if (!quote) fail(404, 'No se encontró la cotización', 'QUOTE_NOT_FOUND');
    if (quote.status !== 'Enviada') fail(409, 'Solo se puede aceptar una cotización enviada', 'INVALID_QUOTE_STATE');
    if (quote.expires_at <= nowIso()) fail(409, 'La cotización ya venció', 'QUOTE_EXPIRED');
    db.prepare("UPDATE quotes SET status = 'Aceptada' WHERE id = ?").run(quoteId);
    return { ok: true, id: quoteId };
  }));

  app.post('/api/quotes/:id/order', (req, res, next) => requestUser(req, res, next, db, ['manager']), route((req) => {
    const quoteId = idText(req.params.id, 'id');
    const dueDate = dateOnly(requireBody(req).dueDate, 'dueDate', { notPast: true });
    const id = `order-${randomUUID()}`;
    let finalId = id;
    inTransaction(db, () => {
      const existing = db.prepare('SELECT id FROM orders WHERE quote_id = ?').get(quoteId);
      if (existing) {
        finalId = existing.id;
        return;
      }
      const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
      if (!quote) fail(404, 'No se encontró la cotización', 'QUOTE_NOT_FOUND');
      if (quote.status !== 'Aceptada') fail(409, 'La cotización debe estar aceptada', 'INVALID_QUOTE_STATE');
      if (quote.expires_at <= nowIso()) fail(409, 'La cotización ya venció', 'QUOTE_EXPIRED');
      const number = nextNumber(db, 'orders', 'PED');
      const createdAt = nowIso();
      db.prepare(`INSERT INTO orders
        (id, number, quote_id, client_id, article_id, quantity, unit, units, status, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?)`)
        .run(id, number, quote.id, quote.client_id, quote.article_id, quote.quantity, quote.unit, quote.units, dueDate, createdAt);
      const requirements = db.prepare('SELECT insumo_id, grams_per_unit FROM article_bom WHERE article_id = ? ORDER BY insumo_id')
        .all(quote.article_id);
      for (const item of requirements) {
        const requiredGrams = item.grams_per_unit * quote.units;
        const stock = db.prepare('SELECT stock_grams FROM insumos WHERE id = ?').get(item.insumo_id);
        const free = Math.max(0, stock.stock_grams - reservedGrams(db, item.insumo_id));
        const reserve = Math.min(requiredGrams, free);
        db.prepare(`INSERT INTO order_requirements
          (order_id, insumo_id, grams_per_unit, required_grams, reserved_grams, consumed_grams)
          VALUES (?, ?, ?, ?, ?, 0)`)
          .run(id, item.insumo_id, item.grams_per_unit, requiredGrams, reserve);
      }
      addHistory(db, id, req.user, 'Pedido creado desde cotización');
      finalId = id;
    });
    return { ok: true, id: finalId };
  }));

  app.post('/api/stock/receive', (req, res, next) => requestUser(req, res, next, db, ['manager', 'admin']), route((req) => {
    const body = requireBody(req);
    const insumoId = idText(body.insumoId, 'insumoId');
    const grams = integer(body.grams, 'grams', { min: 1, max: 100_000_000 });
    const memo = text(body.memo, 'memo', { max: 500 });
    const stock = db.prepare('SELECT stock_grams FROM insumos WHERE id = ?').get(insumoId);
    if (!stock) fail(404, 'No se encontró el insumo', 'INSUMO_NOT_FOUND');
    if (stock.stock_grams + grams > MAX_STOCK_GRAMS) fail(400, 'El ingreso supera el límite de stock permitido', 'STOCK_LIMIT');
    const id = `movement-${randomUUID()}`;
    inTransaction(db, () => {
      db.prepare('UPDATE insumos SET stock_grams = stock_grams + ? WHERE id = ?').run(grams, insumoId);
      db.prepare(`INSERT INTO movements (id, insumo_id, grams, type, memo, created_at)
        VALUES (?, ?, ?, 'Ingreso', ?, ?)`)
        .run(id, insumoId, grams, memo, nowIso());
      allocateAvailableStock(db, insumoId);
    });
    return { ok: true, id };
  }));

  app.post('/api/insumos/:id/price', (req, res, next) => requestUser(req, res, next, db, ['manager', 'admin']), route((req) => {
    const insumoId = idText(req.params.id, 'id');
    const price = integer(requireBody(req).priceCentsPerKg, 'priceCentsPerKg', { min: 1, max: 1_000_000_000 });
    const result = db.prepare('UPDATE insumos SET price_cents_per_kg = ?, price_date = ? WHERE id = ?')
      .run(price, dayString(), insumoId);
    if (result.changes === 0) fail(404, 'No se encontró el insumo', 'INSUMO_NOT_FOUND');
    return { ok: true, id: insumoId };
  }));

  app.post('/api/orders/:id/plan', (req, res, next) => requestUser(req, res, next, db, ['manager']), route((req) => {
    const orderId = idText(req.params.id, 'id');
    const body = requireBody(req);
    const machineId = idText(body.machineId, 'machineId');
    const priority = integer(body.priority, 'priority', { min: 1, max: 10 });
    inTransaction(db, () => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (!order) fail(404, 'No se encontró el pedido', 'ORDER_NOT_FOUND');
      if (order.status !== 'Pendiente') fail(409, 'No se puede cambiar el plan de un pedido en producción o finalizado', 'INVALID_ORDER_STATE');
      const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId);
      if (!machine) fail(404, 'No se encontró la máquina', 'MACHINE_NOT_FOUND');
      if (!db.prepare('SELECT 1 FROM article_machines WHERE article_id = ? AND machine_id = ?').get(order.article_id, machineId)) {
        fail(409, 'La máquina no es compatible con el artículo', 'MACHINE_INCOMPATIBLE');
      }
      db.prepare('UPDATE orders SET machine_id = ?, priority = ? WHERE id = ?').run(machineId, priority, orderId);
      addHistory(db, orderId, req.user, `Planificado en ${machineId} con prioridad ${priority}`);
    });
    return { ok: true, id: orderId };
  }));

  app.post('/api/orders/:id/start', (req, res, next) => requestUser(req, res, next, db, ['operator', 'manager']), route((req) => {
    const orderId = idText(req.params.id, 'id');
    inTransaction(db, () => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (!order) fail(404, 'No se encontró el pedido', 'ORDER_NOT_FOUND');
      if (order.status !== 'Pendiente') fail(409, 'El pedido no está pendiente', 'INVALID_ORDER_STATE');
      if (!order.machine_id) fail(409, 'Asigne una máquina antes de iniciar', 'MACHINE_REQUIRED');
      const active = db.prepare("SELECT id FROM orders WHERE machine_id = ? AND status = 'En producción' LIMIT 1").get(order.machine_id);
      if (active) fail(409, 'La máquina ya tiene un pedido en producción', 'MACHINE_BUSY');
      const shortage = db.prepare(`SELECT insumo_id FROM order_requirements
        WHERE order_id = ? AND required_grams > reserved_grams + consumed_grams LIMIT 1`).get(orderId);
      if (shortage) fail(409, 'Falta reservar insumo para iniciar el pedido', 'INSUFFICIENT_STOCK');
      db.prepare("UPDATE orders SET status = 'En producción' WHERE id = ?").run(orderId);
      addHistory(db, orderId, req.user, 'Producción iniciada');
      notifyOrder(db, orderId, 'En producción');
    });
    return { ok: true, id: orderId };
  }));

  app.post('/api/orders/:id/progress', (req, res, next) => requestUser(req, res, next, db, ['operator', 'manager']), route((req) => {
    const orderId = idText(req.params.id, 'id');
    const body = requireBody(req);
    const producedUnits = integer(body.producedUnits, 'producedUnits', { min: 0, max: MAX_UNITS });
    const qualityChecked = boolean(body.qualityChecked, 'qualityChecked');
    inTransaction(db, () => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (!order) fail(404, 'No se encontró el pedido', 'ORDER_NOT_FOUND');
      if (order.status !== 'En producción') fail(409, 'El pedido no está en producción', 'INVALID_ORDER_STATE');
      if (producedUnits < order.produced_units) fail(400, 'La producción acumulada no puede disminuir', 'PRODUCTION_DECREASE');
      if (producedUnits > order.units) fail(400, 'La producción no puede superar la cantidad pedida', 'OVERPRODUCTION');
      if (qualityChecked && producedUnits !== order.units) fail(400, 'El control de calidad requiere completar el pedido', 'QUALITY_INCOMPLETE');
      const requirements = db.prepare('SELECT * FROM order_requirements WHERE order_id = ? ORDER BY insumo_id').all(orderId);
      const updates = [];
      for (const requirement of requirements) {
        const target = producedUnits * requirement.grams_per_unit;
        const consumed = target - requirement.consumed_grams;
        if (consumed < 0 || consumed > requirement.reserved_grams) fail(409, 'La reserva no alcanza para el avance informado', 'RESERVATION_INVARIANT');
        const stock = db.prepare('SELECT stock_grams FROM insumos WHERE id = ?').get(requirement.insumo_id);
        if (consumed > stock.stock_grams) fail(409, 'El stock físico no alcanza para consumir la reserva', 'STOCK_INVARIANT');
        updates.push({ requirement, consumed });
      }
      for (const { requirement, consumed } of updates) {
        if (consumed === 0) continue;
        db.prepare(`UPDATE order_requirements SET reserved_grams = reserved_grams - ?, consumed_grams = consumed_grams + ?
          WHERE order_id = ? AND insumo_id = ?`).run(consumed, consumed, orderId, requirement.insumo_id);
        db.prepare('UPDATE insumos SET stock_grams = stock_grams - ? WHERE id = ?').run(consumed, requirement.insumo_id);
        db.prepare(`INSERT INTO movements (id, insumo_id, grams, type, order_id, memo, created_at)
          VALUES (?, ?, ?, 'Consumo', ?, ?, ?)`)
          .run(`movement-${randomUUID()}`, requirement.insumo_id, consumed, orderId, `Producción ${order.number}`, nowIso());
      }
      const becameReady = qualityChecked;
      db.prepare('UPDATE orders SET produced_units = ?, quality_checked = ?, status = ? WHERE id = ?')
        .run(producedUnits, qualityChecked ? 1 : 0, becameReady ? 'Listo' : 'En producción', orderId);
      if (producedUnits !== order.produced_units) addHistory(db, orderId, req.user, `Producción acumulada: ${producedUnits}/${order.units} unidades`);
      if (qualityChecked) {
        addHistory(db, orderId, req.user, 'Control de calidad aprobado');
        notifyOrder(db, orderId, 'Listo');
      }
    });
    return { ok: true, id: orderId };
  }));

  app.post('/api/orders/:id/state', (req, res, next) => requestUser(req, res, next, db, ['manager', 'admin']), route((req) => {
    const orderId = idText(req.params.id, 'id');
    const status = enumValue(requireBody(req).status, 'status', ['Entregado', 'Pendiente de cobro', 'Cobrado']);
    const nextStatus = { Listo: 'Entregado', Entregado: 'Pendiente de cobro', 'Pendiente de cobro': 'Cobrado' };
    inTransaction(db, () => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (!order) fail(404, 'No se encontró el pedido', 'ORDER_NOT_FOUND');
      if (nextStatus[order.status] !== status) fail(409, 'La transición de estado no es válida', 'INVALID_STATE_TRANSITION');
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
      addHistory(db, orderId, req.user, `Estado actualizado: ${status}`);
      if (status === 'Entregado') notifyOrder(db, orderId, 'Entregado');
    });
    return { ok: true, id: orderId };
  }));

  app.post('/api/orders/:id/date', (req, res, next) => requestUser(req, res, next, db, ['manager']), route((req) => {
    const orderId = idText(req.params.id, 'id');
    const body = requireBody(req);
    const dueDate = dateOnly(body.dueDate, 'dueDate', { notPast: true });
    const memo = text(body.memo, 'memo', { max: 500 });
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) fail(404, 'No se encontró el pedido', 'ORDER_NOT_FOUND');
    if (['Entregado', 'Pendiente de cobro', 'Cobrado'].includes(order.status)) fail(409, 'No se puede cambiar la fecha de un pedido finalizado', 'INVALID_ORDER_STATE');
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(order.client_id);
    inTransaction(db, () => {
      db.prepare('UPDATE orders SET due_date = ? WHERE id = ?').run(dueDate, orderId);
      addHistory(db, orderId, req.user, `Fecha de entrega actualizada: ${memo}`);
      addNotification(db, {
        orderId,
        clientId: order.client_id,
        event: 'Cambio de fecha de entrega',
        recipient: client.email,
        subject: `Cambio de fecha del pedido ${order.number}`,
        body: `La fecha de entrega se actualizó al ${dueDate}. Motivo: ${memo}`,
      });
    });
    return { ok: true, id: orderId };
  }));

  app.post('/api/notifications/:id/retry', (req, res, next) => requestUser(req, res, next, db, ['manager', 'admin']), route((req) => {
    const notificationId = idText(req.params.id, 'id');
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId);
    if (!notification) fail(404, 'No se encontró la notificación', 'NOTIFICATION_NOT_FOUND');
    if (notification.status !== 'Pendiente de reintento') fail(409, 'La notificación no está pendiente de reintento', 'NOTIFICATION_NOT_PENDING');
    const client = db.prepare('SELECT email FROM clients WHERE id = ?').get(notification.client_id);
    const delivery = notificationDelivery(client?.email);
    if (!delivery.recipient) fail(409, 'La notificación no tiene un destinatario de contacto', 'NOTIFICATION_RECIPIENT_MISSING');
    db.prepare(`UPDATE notifications SET recipient = ?, status = 'Registrada', retry_count = retry_count + 1 WHERE id = ?`)
      .run(delivery.recipient, notificationId);
    return { ok: true, id: notificationId };
  }));

  app.post('/api/demo/reset', (req, res, next) => requestUser(req, res, next, db, ['manager', 'technology']), route((req) => {
    if (!demoMode) fail(403, 'El reinicio está deshabilitado fuera del modo demo', 'DEMO_RESET_DISABLED');
    const confirmation = text(requireBody(req).confirmation, 'confirmation', { max: 40 });
    if (confirmation !== 'REINICIAR DEMO') fail(400, 'La confirmación no coincide', 'CONFIRMATION_REQUIRED');
    if (!isDemoDatabase(db) || !resetDemoDatabase(db)) fail(403, 'La base contiene datos ajenos al demo', 'NON_DEMO_DATA');
    return { ok: true };
  }));

  app.post('/api/users/:id/enabled', (req, res, next) => requestUser(req, res, next, db, ['technology']), route((req) => {
    const targetId = idText(req.params.id, 'id');
    const enabled = boolean(requireBody(req).enabled, 'enabled');
    if (targetId === req.user.id && !enabled) fail(400, 'No puede deshabilitar su propia cuenta', 'SELF_DISABLE');
    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!target) fail(404, 'No se encontró el usuario', 'USER_NOT_FOUND');
    inTransaction(db, () => {
      db.prepare('UPDATE users SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, targetId);
      if (!enabled) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(targetId);
    });
    return { ok: true, id: targetId };
  }));

  app.use('/api', (_req, res) => sendError(res, new ApiError(404, 'No se encontró la ruta', 'NOT_FOUND')));
  if (existsSync(distIndex)) app.use(express.static(distDirectory, { index: false, fallthrough: true }));
  app.get(/.*/, (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) return next();
    if (existsSync(distIndex)) return res.sendFile(distIndex);
    return res.type('html').send('<!doctype html><html lang="es"><meta charset="utf-8"><title>JACSA Gestión</title><body><div id="root"></div></body></html>');
  });
  app.use((error, _req, res, _next) => sendError(res, error));

  app.locals.close = () => {
    if (!closed) {
      closed = true;
      db.close();
    }
  };
  return app;
}
