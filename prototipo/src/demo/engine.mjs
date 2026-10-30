import { createSeed } from './seed.mjs';
import {
  DemoError,
  BUSINESS_KEY,
  readEnvelope,
  readSession,
  readSessionUserId,
  removeSession,
  writeEnvelope,
  writeSession,
} from './store.mjs';

const UNIT_FACTORS = Object.freeze({ unidad: 1, gruesa: 144, '100pares': 200 });
const MAX_UNITS = 1_000_000;
const MAX_STOCK_GRAMS = 1_000_000_000_000;
const ORDER_ACTIVE = new Set(['Pendiente', 'En producción']);
const ORDER_UNFINISHED = new Set(['Pendiente', 'En producción', 'Listo']);
const ORDER_CLOSED = new Set(['Entregado', 'Pendiente de cobro', 'Cobrado']);
let idSequence = 0;

function fail(status, message, code = 'INVALID_INPUT') {
  throw new DemoError(status, code, message);
}

function id(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${(++idSequence).toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

function clone(value) {
  return structuredClone(value);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireBody(value) {
  if (!isObject(value)) fail(400, 'El cuerpo debe ser un objeto JSON', 'INVALID_BODY');
  return value;
}

function text(value, label, { max = 500, min = 1, optional = false, allowMarkup = false } = {}) {
  if (optional && (value === undefined || value === null)) return '';
  if (typeof value !== 'string') fail(400, `${label} debe ser texto`);
  const normalized = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (!allowMarkup && /[<>]/.test(normalized)) fail(400, `${label} no puede contener marcado HTML`);
  if (normalized.length < min || normalized.length > max) fail(400, `${label} debe tener entre ${min} y ${max} caracteres`);
  return normalized;
}

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    fail(400, `${label} debe ser un entero entre ${min} y ${max}`);
  }
  return value;
}

function finiteNumber(value, label, { min = 0, max = 500 } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(400, `${label} debe ser un número entre ${min} y ${max}`);
  }
  return value;
}

function boolean(value, label) {
  if (typeof value !== 'boolean') fail(400, `${label} debe ser verdadero o falso`);
  return value;
}

function enumValue(value, label, options) {
  if (typeof value !== 'string' || !options.includes(value)) fail(400, `${label} no es válido`);
  return value;
}

function dayString(date) {
  return date.toISOString().slice(0, 10);
}

function dateOnly(value, label, now, { notPast = false } = {}) {
  const validFormat = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = validFormat ? new Date(`${value}T00:00:00.000Z`) : new Date(Number.NaN);
  if (!validFormat || Number.isNaN(date.valueOf()) || dayString(date) !== value) fail(400, `${label} debe tener formato YYYY-MM-DD`, 'INVALID_DATE');
  if (notPast && value < dayString(now)) fail(400, `${label} no puede ser anterior a hoy`, 'INVALID_DATE');
  return value;
}

function idText(value, label) {
  return text(value, label, { max: 80 });
}

function safeCents(value) {
  if (!Number.isSafeInteger(value) || value < 0) fail(400, 'El importe excede el límite permitido', 'AMOUNT_LIMIT');
  return value;
}

function parseQuantity(body) {
  const quantity = integer(body.quantity, 'quantity', { min: 1, max: 1_000_000 });
  const unit = enumValue(body.unit, 'unit', Object.keys(UNIT_FACTORS));
  const units = quantity * UNIT_FACTORS[unit];
  if (!Number.isSafeInteger(units) || units > MAX_UNITS) fail(400, `La cantidad no puede superar ${MAX_UNITS} unidades`, 'QUANTITY_LIMIT');
  return { quantity, unit, units };
}

function markupBasisPoints(percent) {
  return Math.round(percent * 100);
}

function netFor(costCents, units, markupPercent) {
  const factor = BigInt(10_000 + markupBasisPoints(markupPercent));
  const amount = (BigInt(costCents) * BigInt(units) * factor + 5_000n) / 10_000n;
  return safeCents(Number(amount));
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

function currentQuoteStatus(quote, now) {
  if (['Pendiente', 'Enviada', 'Aceptada'].includes(quote.status) && quote.expiresAt <= now.toISOString()) return 'Vencida';
  return quote.status;
}

function userShape(user) {
  if (!user) return null;
  const { id: userId, name, username, role, clientId } = user;
  return { id: userId, name, username, role, ...(clientId ? { clientId } : {}) };
}

function activeUser(data, session) {
  const sessionProfile = readSession(session);
  if (!sessionProfile) return null;
  const user = data.users.find((candidate) => candidate.id === sessionProfile.userId);
  if (!user?.enabled || (user.sessionEpoch ?? 0) !== sessionProfile.sessionEpoch) return null;
  return user;
}

function requireUser(data, session, roles = null) {
  const user = activeUser(data, session);
  if (!user) fail(401, 'Inicie sesión para continuar', 'UNAUTHENTICATED');
  if (roles && !roles.includes(user.role)) fail(403, 'No tiene permiso para esta operación', 'FORBIDDEN');
  return user;
}

function articleData(data, articleId, now) {
  const article = data.articles.find((candidate) => candidate.id === articleId);
  if (!article) return null;
  if (!article.bom?.length) fail(409, 'El artículo no tiene una lista de materiales configurada', 'ARTICLE_NOT_CONFIGURED');
  let costCents = article.machineCostCents + article.otherCostCents;
  let stale = false;
  const staleBefore = new Date(now);
  staleBefore.setUTCHours(0, 0, 0, 0);
  staleBefore.setUTCDate(staleBefore.getUTCDate() - 15);
  for (const item of article.bom) {
    const insumo = data.insumos.find((candidate) => candidate.id === item.insumoId);
    if (!insumo) fail(409, 'El artículo tiene un insumo no configurado', 'ARTICLE_NOT_CONFIGURED');
    costCents += centsForGrams(insumo.priceCentsPerKg, item.gramsPerUnit);
    stale ||= insumo.priceDate < dayString(staleBefore);
  }
  return { article, costCents: safeCents(costCents), stale };
}

function publicArticle(article) {
  return {
    id: article.id,
    code: article.code,
    name: article.name,
    material: article.material,
    color: article.color,
    threads: article.threads,
    lengthCm: article.lengthCm,
    weave: article.weave,
    unit: article.unit,
    public: true,
  };
}

function articleSnapshot(data, article, role, now) {
  const computed = articleData(data, article.id, now);
  const base = publicArticle(article);
  if (role === 'client' || role === 'technology') {
    if (role === 'technology' || computed.stale) return base;
    return { ...base, priceCents: netFor(computed.costCents, 1, 25) };
  }
  const result = {
    ...base,
    public: article.published,
    stale: computed.stale,
    bom: article.bom.map(({ insumoId, gramsPerUnit }) => ({ insumoId, gramsPerUnit })),
    machineIds: article.machineIds,
  };
  if (role !== 'operator') {
    result.costCents = computed.costCents;
    result.priceCents = netFor(computed.costCents, 1, 25);
  }
  return result;
}

function requirementShortage(requirement) {
  return Math.max(0, requirement.requiredGrams - requirement.reservedGrams - requirement.consumedGrams);
}

function reservedGrams(data, insumoId) {
  return data.orders
    .filter((order) => ORDER_ACTIVE.has(order.status))
    .flatMap((order) => order.requirements)
    .filter((requirement) => requirement.insumoId === insumoId)
    .reduce((total, requirement) => total + requirement.reservedGrams, 0);
}

function mapOrder(order, role, now) {
  const result = {
    id: order.id,
    number: order.number,
    articleId: order.articleId,
    quantity: order.quantity,
    unit: order.unit,
    units: order.units,
    producedUnits: order.producedUnits,
    status: order.status,
    dueDate: order.dueDate,
    priority: order.priority,
    machineId: order.machineId,
    qualityChecked: order.qualityChecked,
    createdAt: order.createdAt,
    history: order.history.map((item) => ({ at: item.at, action: item.action, ...(role !== 'client' && item.by ? { by: item.by } : {}) })),
  };
  if (role !== 'client') result.delayed = order.dueDate < dayString(now) && ORDER_UNFINISHED.has(order.status);
  if (role !== 'operator') {
    result.quoteId = order.quoteId;
    result.clientId = order.clientId;
  }
  if (role !== 'client') result.requirements = order.requirements.map((item) => ({
    insumoId: item.insumoId,
    requiredGrams: item.requiredGrams,
    reservedGrams: item.reservedGrams,
    consumedGrams: item.consumedGrams,
    shortageGrams: requirementShortage(item),
  }));
  return result;
}

function mapInsumo(data, insumo, role) {
  const relevant = data.orders.filter((order) => ORDER_ACTIVE.has(order.status)).flatMap((order) => order.requirements)
    .filter((requirement) => requirement.insumoId === insumo.id);
  const result = {
    id: insumo.id,
    name: insumo.name,
    color: insumo.color,
    stockGrams: insumo.stockGrams,
    reservedGrams: reservedGrams(data, insumo.id),
    availableGrams: insumo.stockGrams - reservedGrams(data, insumo.id),
    minGrams: insumo.minGrams,
    belowMinimum: insumo.stockGrams < insumo.minGrams,
    requiredGrams: relevant.reduce((total, requirement) => total + requirement.requiredGrams - requirement.consumedGrams, 0),
    shortageGrams: relevant.reduce((total, requirement) => total + requirementShortage(requirement), 0),
  };
  if (role !== 'operator') {
    result.priceCentsPerKg = insumo.priceCentsPerKg;
    result.priceDate = insumo.priceDate;
  }
  return result;
}

function mapRequest(request) {
  const result = {
    id: request.id,
    articleId: request.articleId,
    quantity: request.quantity,
    unit: request.unit,
    special: request.special,
    notes: request.notes,
    company: request.company,
    cuit: request.cuit,
    email: request.email,
    phone: request.phone,
    status: request.status,
    createdAt: request.createdAt,
  };
  if (request.clientId) result.clientId = request.clientId;
  return result;
}

function mapQuote(quote, showMarkup, now) {
  const result = {
    id: quote.id,
    number: quote.number,
    clientId: quote.clientId,
    articleId: quote.articleId,
    quantity: quote.quantity,
    unit: quote.unit,
    units: quote.units,
    validDays: quote.validDays,
    netCents: quote.netCents,
    vatCents: quote.vatCents,
    totalCents: quote.totalCents,
    status: currentQuoteStatus(quote, now),
    createdAt: quote.createdAt,
    expiresAt: quote.expiresAt,
  };
  if (quote.requestId) result.requestId = quote.requestId;
  if (showMarkup) result.markupPercent = quote.markupPercent;
  if (showMarkup && quote.staleAccepted) result.staleAccepted = true;
  return result;
}

function notificationDelivery(recipient) {
  const normalizedRecipient = typeof recipient === 'string' ? recipient.trim() : '';
  return { recipient: normalizedRecipient, status: normalizedRecipient ? 'Registrada' : 'Pendiente de reintento' };
}

function addNotification(data, { orderId, quoteId, clientId, event, recipient, subject, body }, now) {
  const delivery = notificationDelivery(recipient);
  const notification = {
    id: id('notification'),
    clientId,
    event,
    recipient: delivery.recipient,
    channel: 'Email',
    status: delivery.status,
    subject,
    body,
    createdAt: now.toISOString(),
  };
  if (orderId) notification.orderId = orderId;
  if (quoteId) notification.quoteId = quoteId;
  data.notifications.push(notification);
  return notification.id;
}

function addOrderNotification(data, order, event, now) {
  const client = data.clients.find((candidate) => candidate.id === order.clientId);
  const article = data.articles.find((candidate) => candidate.id === order.articleId);
  if (!client || !article) fail(404, 'No se encontró el pedido para registrar el aviso', 'ORDER_NOT_FOUND');
  addNotification(data, {
    orderId: order.id,
    clientId: client.id,
    event,
    recipient: client.email,
    subject: `${order.number} — ${article.code} ${article.name} — ${event} — entrega ${order.dueDate}`,
    body: `El pedido ${order.number} del artículo ${article.code} ${article.name} cambió al estado ${event}. Fecha de entrega: ${order.dueDate}.`,
  }, now);
}

function nextNumber(items, prefix) {
  return `${prefix}-${String(items.length + 1).padStart(6, '0')}`;
}

function allocateAvailableStock(data, insumoId) {
  const insumo = data.insumos.find((item) => item.id === insumoId);
  let available = insumo.stockGrams - reservedGrams(data, insumoId);
  if (available <= 0) return;
  const candidates = data.orders.filter((order) => ORDER_ACTIVE.has(order.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const order of candidates) {
    const requirement = order.requirements.find((item) => item.insumoId === insumoId);
    if (!requirement) continue;
    const amount = Math.min(available, requirementShortage(requirement));
    if (amount > 0) {
      requirement.reservedGrams += amount;
      available -= amount;
    }
    if (available === 0) break;
  }
}

function requireFound(items, key, value, label, code) {
  const result = items.find((item) => item[key] === value);
  if (!result) fail(404, `No se encontró ${label}`, code);
  return result;
}

function makeSnapshot(data, user, now) {
  const role = user.role;
  const visibleArticles = role === 'client' || role === 'technology' ? data.articles.filter((item) => item.published) : data.articles;
  const clients = ['manager', 'admin'].includes(role)
    ? data.clients.map(({ id: clientId, name, email, cuit }) => ({ id: clientId, name, email, cuit }))
    : role === 'client'
      ? data.clients.filter((item) => item.id === user.clientId).map(({ id: clientId, name, email, cuit }) => ({ id: clientId, name, email, cuit }))
      : [];
  const requests = ['manager', 'admin'].includes(role)
    ? data.requests
    : role === 'client' ? data.requests.filter((item) => item.clientId === user.clientId) : [];
  const quotes = ['manager', 'admin'].includes(role)
    ? data.quotes.map((item) => mapQuote(item, true, now))
    : role === 'client' ? data.quotes.filter((item) => item.clientId === user.clientId && item.status !== 'Pendiente').map((item) => mapQuote(item, false, now)) : [];
  const orders = ['manager', 'admin', 'operator'].includes(role)
    ? data.orders
    : role === 'client' ? data.orders.filter((item) => item.clientId === user.clientId) : [];
  const insumos = ['manager', 'admin', 'operator'].includes(role)
    ? data.insumos.map((item) => mapInsumo(data, item, role))
    : [];
  const machines = ['manager', 'admin', 'operator'].includes(role)
    ? data.machines.map((machine) => ({ ...machine, activeOrderId: data.orders.find((order) => order.machineId === machine.id && order.status === 'En producción')?.id ?? null }))
    : [];
  const notifications = ['manager', 'admin'].includes(role)
    ? data.notifications
    : role === 'client' ? data.notifications.filter((item) => item.clientId === user.clientId) : [];
  const result = {
    user: userShape(user),
    articles: visibleArticles.map((article) => articleSnapshot(data, article, role, now)),
    clients,
    requests: requests.map(mapRequest),
    quotes,
    orders: orders.map((order) => mapOrder(order, role, now)),
    insumos,
    machines,
    notifications: notifications.map((item) => ({
      id: item.id,
      ...(item.orderId ? { orderId: item.orderId } : {}),
      ...(item.quoteId ? { quoteId: item.quoteId } : {}),
      clientId: item.clientId,
      event: item.event,
      recipient: item.recipient,
      channel: item.channel,
      status: item.status,
      subject: item.subject,
      body: item.body,
      createdAt: item.createdAt,
    })),
    movements: ['manager', 'admin'].includes(role) ? clone(data.movements) : [],
    settings: clone(data.settings),
  };
  if (role === 'technology') result.users = data.users.map(({ id: userId, name, username, role: userRole, clientId, enabled }) => ({
    id: userId, name, username, role: userRole, ...(clientId ? { clientId } : {}), enabled,
  }));
  return result;
}

function parsePath(path) {
  try {
    return new URL(path, 'http://demo.local').pathname;
  } catch {
    return '';
  }
}

function decodeRouteId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    fail(400, 'El identificador de ruta no es válido', 'INVALID_INPUT');
  }
}

export function createEngine({ storage, session, clock = { now: () => new Date() }, runExclusive = async (operation) => operation() }) {
  if (!storage || !session || typeof storage.get !== 'function' || typeof storage.set !== 'function' || typeof storage.remove !== 'function') {
    throw new TypeError('createEngine requiere storage y session con get/set/remove');
  }
  const now = () => {
    const value = clock.now();
    return value instanceof Date ? new Date(value) : new Date(value);
  };
  const read = () => readEnvelope(storage, () => createSeed(now()), now()).data;
  const mutate = (operation) => runExclusive(() => {
    const envelope = readEnvelope(storage, () => createSeed(now()), now());
    const draft = clone(envelope.data);
    const persist = (result) => {
      writeEnvelope(storage, { ...envelope, data: draft });
      return result;
    };
    const result = operation(draft, now());
    return result && typeof result.then === 'function' ? result.then(persist) : persist(result);
  });

  async function dispatch(path, method, body) {
    const pathname = parsePath(path);
    const currentTime = now();

    if (method === 'GET' && pathname === '/api/health') return { ok: true };

    if (method === 'POST' && pathname === '/api/login') {
      const data = read();
      const input = requireBody(body);
      const username = text(input.username, 'username', { max: 80 }).toLowerCase();
      const password = text(input.password, 'password', { max: 1_024, allowMarkup: true });
      const user = data.users.find((item) => item.username === username);
      if (!user?.enabled || user.password !== password) fail(401, 'Usuario o contraseña incorrectos', 'INVALID_CREDENTIALS');
      writeSession(session, user.id, user.sessionEpoch ?? 0);
      return { user: userShape(user) };
    }

    if (method === 'POST' && pathname === '/api/logout') {
      removeSession(session);
      return { ok: true };
    }

    if (method === 'GET' && pathname === '/api/me') {
      const data = read();
      const user = activeUser(data, session);
      return { user: userShape(user) };
    }

    if (method === 'GET' && pathname === '/api/catalog') {
      const data = read();
      return { articles: data.articles.filter((article) => article.published).map(publicArticle) };
    }

    if (method === 'POST' && pathname === '/api/estimate') {
      const data = read();
      const input = requireBody(body);
      const { units } = parseQuantity(input);
      const user = activeUser(data, session);
      if (user && ['operator', 'technology'].includes(user.role)) fail(403, 'No tiene permiso para consultar precios comerciales', 'FORBIDDEN');
      const special = input.special === undefined ? false : boolean(input.special, 'special');
      const articleId = input.articleId === null && special ? '' : idText(input.articleId, 'articleId');
      const computed = articleId ? articleData(data, articleId, currentTime) : null;
      if (special) return { available: false, reason: 'El artículo requiere una cotización especial', units };
      if (!computed || !computed.article.published) return { available: false, reason: 'No hay un precio configurado para este artículo', units };
      if (computed.stale) return { available: false, reason: 'El precio de los insumos requiere actualización', units };
      const netCents = netFor(computed.costCents, units, 25);
      const vatCents = vatFor(netCents);
      return { available: true, units, netCents, vatCents, totalCents: safeCents(netCents + vatCents) };
    }

    if (method === 'POST' && pathname === '/api/requests') {
      return mutate((data, at) => {
        const input = requireBody(body);
        const { quantity, unit } = parseQuantity(input);
        const special = boolean(input.special, 'special');
        const articleId = input.articleId === null ? null : idText(input.articleId, 'articleId');
        if (!special && (!articleId || !data.articles.some((item) => item.id === articleId && item.published))) {
          fail(400, 'Seleccione un artículo público o marque la solicitud como especial', 'INVALID_ARTICLE');
        }
        if (!boolean(input.consent, 'consent')) fail(400, 'Se requiere consentimiento para continuar', 'CONSENT_REQUIRED');
        const company = text(input.company, 'company', { max: 120 });
        const cuit = validCuit(text(input.cuit, 'cuit', { max: 16 }));
        if (!cuit) fail(400, 'El CUIT no es válido', 'INVALID_CUIT');
        const email = text(input.email, 'email', { max: 254 }).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'El email no es válido', 'INVALID_EMAIL');
        const phone = text(input.phone, 'phone', { max: 30 });
        if (!/^[+\d ()-]{7,30}$/.test(phone) || phone.replace(/\D/g, '').length < 7) fail(400, 'El teléfono no es válido', 'INVALID_PHONE');
        const notes = text(input.notes ?? '', 'notes', { max: 1_000, min: 0, optional: true });
        const active = activeUser(data, session);
        const requestId = id('request');
        const request = {
          id: requestId,
          ...(active?.role === 'client' ? { clientId: active.clientId } : {}),
          articleId,
          quantity,
          unit,
          special,
          notes,
          company,
          cuit,
          email,
          phone,
          status: 'Nueva',
          createdAt: at.toISOString(),
        };
        data.requests.push(request);
        return { status: 201, body: { ok: true, id: requestId } };
      });
    }

    if (method === 'GET' && pathname === '/api/bootstrap') {
      const data = read();
      const user = requireUser(data, session);
      return makeSnapshot(data, user, currentTime);
    }

    if (method === 'POST' && pathname === '/api/quotes') {
      return mutate((data, at) => {
        requireUser(data, session, ['manager']);
        const input = requireBody(body);
        const clientId = idText(input.clientId, 'clientId');
        const articleId = idText(input.articleId, 'articleId');
        const client = data.clients.find((item) => item.id === clientId);
        if (!client) fail(404, 'No se encontró el cliente', 'CLIENT_NOT_FOUND');
        const computed = articleData(data, articleId, at);
        if (!computed) fail(404, 'No se encontró el artículo', 'ARTICLE_NOT_FOUND');
        const { quantity, unit, units } = parseQuantity(input);
        const markupPercent = finiteNumber(input.markupPercent, 'markupPercent', { min: 0, max: 500 });
        const validDays = integer(input.validDays, 'validDays', { min: 1, max: 365 });
        const allowStale = input.allowStale === undefined ? false : boolean(input.allowStale, 'allowStale');
        if (computed.stale && !allowStale) fail(409, 'Confirme el uso del precio vencido para continuar', 'STALE_PRICE');
        const requestId = input.requestId === undefined ? null : idText(input.requestId, 'requestId');
        const request = requestId ? data.requests.find((item) => item.id === requestId) : null;
        if (requestId && !request) fail(404, 'No se encontró la solicitud', 'REQUEST_NOT_FOUND');
        if (request && request.status !== 'Nueva') fail(409, 'La solicitud ya fue cotizada', 'REQUEST_ALREADY_QUOTED');
        if (request?.clientId && request.clientId !== clientId) fail(403, 'La solicitud pertenece a otro cliente', 'CLIENT_MISMATCH');
        const netCents = netFor(computed.costCents, units, markupPercent);
        const vatCents = vatFor(netCents);
        const quoteId = id('quote');
        const number = nextNumber(data.quotes, 'COT');
        const createdAt = at.toISOString();
        const expiresAt = new Date(at.valueOf() + validDays * 86_400_000).toISOString();
        data.quotes.push({
          id: quoteId,
          number,
          ...(requestId ? { requestId } : {}),
          clientId,
          articleId,
          quantity,
          unit,
          units,
          markupPercent,
          validDays,
          netCents,
          vatCents,
          totalCents: safeCents(netCents + vatCents),
          status: 'Pendiente',
          staleAccepted: computed.stale,
          createdAt,
          expiresAt,
        });
        if (requestId) {
          if (!request.clientId) request.clientId = clientId;
          request.status = 'Cotizada';
        }
        return { status: 201, body: { ok: true, id: quoteId } };
      });
    }

    const quoteAction = pathname.match(/^\/api\/quotes\/([^/]+)\/(send|accept|order)$/);
    if (method === 'POST' && quoteAction) {
      const quoteId = decodeRouteId(quoteAction[1]);
      const action = quoteAction[2];
      if (action === 'order') {
        return mutate((data, at) => {
          requireUser(data, session, ['manager']);
          const input = requireBody(body);
          const dueDate = dateOnly(input.dueDate, 'dueDate', at, { notPast: true });
          const existing = data.orders.find((order) => order.quoteId === quoteId);
          if (existing) return { ok: true, id: existing.id };
          const quote = requireFound(data.quotes, 'id', quoteId, 'la cotización', 'QUOTE_NOT_FOUND');
          if (quote.status !== 'Aceptada') fail(409, 'La cotización debe estar aceptada', 'INVALID_QUOTE_STATE');
          if (quote.expiresAt <= at.toISOString()) fail(409, 'La cotización ya venció', 'QUOTE_EXPIRED');
          const article = requireFound(data.articles, 'id', quote.articleId, 'el artículo', 'ARTICLE_NOT_FOUND');
          const orderId = id('order');
          const order = {
            id: orderId,
            number: nextNumber(data.orders, 'PED'),
            quoteId: quote.id,
            clientId: quote.clientId,
            articleId: quote.articleId,
            quantity: quote.quantity,
            unit: quote.unit,
            units: quote.units,
            producedUnits: 0,
            status: 'Pendiente',
            dueDate,
            priority: 3,
            machineId: null,
            qualityChecked: false,
            createdAt: at.toISOString(),
            requirements: [],
            history: [],
          };
          for (const item of article.bom) {
            const requiredGrams = item.gramsPerUnit * quote.units;
            const insumo = requireFound(data.insumos, 'id', item.insumoId, 'el insumo', 'INSUMO_NOT_FOUND');
            const free = Math.max(0, insumo.stockGrams - reservedGrams(data, item.insumoId));
            const reserved = Math.min(requiredGrams, free);
            order.requirements.push({ insumoId: item.insumoId, gramsPerUnit: item.gramsPerUnit, requiredGrams, reservedGrams: reserved, consumedGrams: 0, shortageGrams: 0 });
          }
          order.history.push({ at: at.toISOString(), by: userShape(activeUser(data, session)).id, action: 'Pedido creado desde cotización' });
          data.orders.push(order);
          return { ok: true, id: orderId };
        });
      }
      return mutate((data, at) => {
        requireUser(data, session, ['manager']);
        const quote = requireFound(data.quotes, 'id', quoteId, 'la cotización', 'QUOTE_NOT_FOUND');
        if (action === 'send') {
          if (quote.status !== 'Pendiente') fail(409, 'La cotización no está pendiente', 'INVALID_QUOTE_STATE');
          if (quote.expiresAt <= at.toISOString()) fail(409, 'La cotización ya venció', 'QUOTE_EXPIRED');
          const client = requireFound(data.clients, 'id', quote.clientId, 'el cliente', 'CLIENT_NOT_FOUND');
          quote.status = 'Enviada';
          addNotification(data, {
            quoteId,
            clientId: client.id,
            event: 'Cotización enviada',
            recipient: client.email,
            subject: `Cotización ${quote.number}`,
            body: `La cotización ${quote.number} está disponible para su revisión.`,
          }, at);
          return { ok: true, id: quoteId };
        }
        if (quote.status !== 'Enviada') fail(409, 'Solo se puede aceptar una cotización enviada', 'INVALID_QUOTE_STATE');
        if (quote.expiresAt <= at.toISOString()) fail(409, 'La cotización ya venció', 'QUOTE_EXPIRED');
        quote.status = 'Aceptada';
        return { ok: true, id: quoteId };
      });
    }

    if (method === 'POST' && pathname === '/api/stock/receive') {
      return mutate((data, at) => {
        requireUser(data, session, ['manager', 'admin']);
        const input = requireBody(body);
        const insumoId = idText(input.insumoId, 'insumoId');
        const grams = integer(input.grams, 'grams', { min: 1, max: 100_000_000 });
        const memo = text(input.memo, 'memo', { max: 500 });
        const insumo = requireFound(data.insumos, 'id', insumoId, 'el insumo', 'INSUMO_NOT_FOUND');
        if (insumo.stockGrams + grams > MAX_STOCK_GRAMS) fail(400, 'El ingreso supera el límite de stock permitido', 'STOCK_LIMIT');
        insumo.stockGrams += grams;
        const movementId = id('movement');
        data.movements.push({ id: movementId, insumoId, grams, type: 'Ingreso', memo, createdAt: at.toISOString() });
        allocateAvailableStock(data, insumoId);
        return { ok: true, id: movementId };
      });
    }

    const priceAction = pathname.match(/^\/api\/insumos\/([^/]+)\/price$/);
    if (method === 'POST' && priceAction) {
      const insumoId = decodeRouteId(priceAction[1]);
      return mutate((data, at) => {
        requireUser(data, session, ['manager', 'admin']);
        const price = integer(requireBody(body).priceCentsPerKg, 'priceCentsPerKg', { min: 1, max: 1_000_000_000 });
        const insumo = requireFound(data.insumos, 'id', insumoId, 'el insumo', 'INSUMO_NOT_FOUND');
        insumo.priceCentsPerKg = price;
        insumo.priceDate = dayString(at);
        return { ok: true, id: insumoId };
      });
    }

    const orderAction = pathname.match(/^\/api\/orders\/([^/]+)\/(plan|start|progress|state|date)$/);
    if (method === 'POST' && orderAction) {
      const orderId = decodeRouteId(orderAction[1]);
      const action = orderAction[2];
      return mutate((data, at) => {
        if (action === 'plan') {
          const user = requireUser(data, session, ['manager']);
          const order = requireFound(data.orders, 'id', orderId, 'el pedido', 'ORDER_NOT_FOUND');
          const input = requireBody(body);
          const machineId = idText(input.machineId, 'machineId');
          const priority = integer(input.priority, 'priority', { min: 1, max: 10 });
          if (order.status !== 'Pendiente') fail(409, 'No se puede cambiar el plan de un pedido en producción o finalizado', 'INVALID_ORDER_STATE');
          const machine = requireFound(data.machines, 'id', machineId, 'la máquina', 'MACHINE_NOT_FOUND');
          const article = requireFound(data.articles, 'id', order.articleId, 'el artículo', 'ARTICLE_NOT_FOUND');
          if (!article.machineIds.includes(machine.id)) fail(409, 'La máquina no es compatible con el artículo', 'MACHINE_INCOMPATIBLE');
          order.machineId = machine.id;
          order.priority = priority;
          order.history.push({ at: at.toISOString(), by: user.id, action: `Planificado en ${machine.id} con prioridad ${priority}` });
          return { ok: true, id: orderId };
        }
        if (action === 'start') {
          const user = requireUser(data, session, ['operator', 'manager']);
          const order = requireFound(data.orders, 'id', orderId, 'el pedido', 'ORDER_NOT_FOUND');
          if (order.status !== 'Pendiente') fail(409, 'El pedido no está pendiente', 'INVALID_ORDER_STATE');
          if (!order.machineId) fail(409, 'Asigne una máquina antes de iniciar', 'MACHINE_REQUIRED');
          if (data.orders.some((candidate) => candidate.machineId === order.machineId && candidate.status === 'En producción')) fail(409, 'La máquina ya tiene un pedido en producción', 'MACHINE_BUSY');
          if (order.requirements.some((requirement) => requirement.requiredGrams > requirement.reservedGrams + requirement.consumedGrams)) {
            fail(409, 'Falta reservar insumo para iniciar el pedido', 'INSUFFICIENT_STOCK');
          }
          order.status = 'En producción';
          order.history.push({ at: at.toISOString(), by: user.id, action: 'Producción iniciada' });
          addOrderNotification(data, order, 'En producción', at);
          return { ok: true, id: orderId };
        }
        if (action === 'progress') {
          const user = requireUser(data, session, ['operator', 'manager']);
          const order = requireFound(data.orders, 'id', orderId, 'el pedido', 'ORDER_NOT_FOUND');
          const input = requireBody(body);
          const producedUnits = integer(input.producedUnits, 'producedUnits', { min: 0, max: MAX_UNITS });
          const qualityChecked = boolean(input.qualityChecked, 'qualityChecked');
          if (order.status !== 'En producción') fail(409, 'El pedido no está en producción', 'INVALID_ORDER_STATE');
          if (producedUnits < order.producedUnits) fail(400, 'La producción acumulada no puede disminuir', 'PRODUCTION_DECREASE');
          if (producedUnits > order.units) fail(400, 'La producción no puede superar la cantidad pedida', 'OVERPRODUCTION');
          if (qualityChecked && producedUnits !== order.units) fail(400, 'El control de calidad requiere completar el pedido', 'QUALITY_INCOMPLETE');
          const updates = order.requirements.map((requirement) => {
            const target = producedUnits * requirement.gramsPerUnit;
            const consumed = target - requirement.consumedGrams;
            if (consumed < 0 || consumed > requirement.reservedGrams) fail(409, 'La reserva no alcanza para el avance informado', 'RESERVATION_INVARIANT');
            const insumo = requireFound(data.insumos, 'id', requirement.insumoId, 'el insumo', 'INSUMO_NOT_FOUND');
            if (consumed > insumo.stockGrams) fail(409, 'El stock físico no alcanza para consumir la reserva', 'STOCK_INVARIANT');
            return { requirement, insumo, consumed };
          });
          for (const { requirement, insumo, consumed } of updates) {
            if (consumed === 0) continue;
            requirement.reservedGrams -= consumed;
            requirement.consumedGrams += consumed;
            insumo.stockGrams -= consumed;
            data.movements.push({
              id: id('movement'),
              insumoId: insumo.id,
              grams: consumed,
              type: 'Consumo',
              orderId,
              memo: `Producción ${order.number}`,
              createdAt: at.toISOString(),
            });
          }
          const previousProducedUnits = order.producedUnits;
          order.producedUnits = producedUnits;
          order.qualityChecked = qualityChecked;
          order.status = qualityChecked ? 'Listo' : 'En producción';
          if (producedUnits !== previousProducedUnits) order.history.push({ at: at.toISOString(), by: user.id, action: `Producción acumulada: ${producedUnits}/${order.units} unidades` });
          if (qualityChecked) {
            order.history.push({ at: at.toISOString(), by: user.id, action: 'Control de calidad aprobado' });
            addOrderNotification(data, order, 'Listo', at);
          }
          return { ok: true, id: orderId };
        }
        if (action === 'state') {
          const user = requireUser(data, session, ['manager', 'admin']);
          const order = requireFound(data.orders, 'id', orderId, 'el pedido', 'ORDER_NOT_FOUND');
          const status = enumValue(requireBody(body).status, 'status', ['Entregado', 'Pendiente de cobro', 'Cobrado']);
          const nextStatus = { Listo: 'Entregado', Entregado: 'Pendiente de cobro', 'Pendiente de cobro': 'Cobrado' };
          if (nextStatus[order.status] !== status) fail(409, 'La transición de estado no es válida', 'INVALID_STATE_TRANSITION');
          order.status = status;
          order.history.push({ at: at.toISOString(), by: user.id, action: `Estado actualizado: ${status}` });
          if (status === 'Entregado') addOrderNotification(data, order, 'Entregado', at);
          return { ok: true, id: orderId };
        }
        const user = requireUser(data, session, ['manager']);
        const order = requireFound(data.orders, 'id', orderId, 'el pedido', 'ORDER_NOT_FOUND');
        const input = requireBody(body);
        const dueDate = dateOnly(input.dueDate, 'dueDate', at, { notPast: true });
        const memo = text(input.memo, 'memo', { max: 500 });
        if (ORDER_CLOSED.has(order.status)) fail(409, 'No se puede cambiar la fecha de un pedido finalizado', 'INVALID_ORDER_STATE');
        const client = requireFound(data.clients, 'id', order.clientId, 'el cliente', 'CLIENT_NOT_FOUND');
        order.dueDate = dueDate;
        order.history.push({ at: at.toISOString(), by: user.id, action: `Fecha de entrega actualizada: ${memo}` });
        addNotification(data, {
          orderId,
          clientId: client.id,
          event: 'Cambio de fecha de entrega',
          recipient: client.email,
          subject: `Cambio de fecha del pedido ${order.number}`,
          body: `La fecha de entrega se actualizó al ${dueDate}. Motivo: ${memo}`,
        }, at);
        return { ok: true, id: orderId };
      });
    }

    const notificationAction = pathname.match(/^\/api\/notifications\/([^/]+)\/retry$/);
    if (method === 'POST' && notificationAction) {
      const notificationId = decodeRouteId(notificationAction[1]);
      return mutate((data) => {
        requireUser(data, session, ['manager', 'admin']);
        const notification = requireFound(data.notifications, 'id', notificationId, 'la notificación', 'NOTIFICATION_NOT_FOUND');
        if (notification.status !== 'Pendiente de reintento') fail(409, 'La notificación no está pendiente de reintento', 'NOTIFICATION_NOT_PENDING');
        const client = data.clients.find((item) => item.id === notification.clientId);
        const delivery = notificationDelivery(client?.email);
        if (!delivery.recipient) fail(409, 'La notificación no tiene un destinatario de contacto', 'NOTIFICATION_RECIPIENT_MISSING');
        notification.recipient = delivery.recipient;
        notification.status = 'Registrada';
        notification.retryCount = (notification.retryCount ?? 0) + 1;
        return { ok: true, id: notificationId };
      });
    }

    if (method === 'POST' && pathname === '/api/demo/reset') {
      const input = requireBody(body);
      const confirmation = text(input.confirmation, 'confirmation', { max: 40 });
      if (confirmation !== 'REINICIAR DEMO') fail(400, 'La confirmación no coincide', 'CONFIRMATION_REQUIRED');
      const sessionUserId = readSessionUserId(session);
      if (!sessionUserId) fail(401, 'Inicie sesión para continuar', 'UNAUTHENTICATED');
      return runExclusive(() => {
        try {
          requireUser(read(), session, ['manager', 'technology']);
        } catch (error) {
          if (!(error instanceof DemoError) || error.code !== 'STORAGE_CORRUPT') throw error;
          const fallbackUser = createSeed(now()).users.find((candidate) => candidate.id === sessionUserId && candidate.enabled);
          if (!fallbackUser) fail(401, 'Inicie sesión para continuar', 'UNAUTHENTICATED');
          if (!['manager', 'technology'].includes(fallbackUser.role)) fail(403, 'No tiene permiso para esta operación', 'FORBIDDEN');
        }
        const replacementData = createSeed(now());
        const requester = replacementData.users.find((candidate) => candidate.id === sessionUserId);
        if (requester) requester.sessionEpoch = readSession(session).sessionEpoch;
        const replacement = { version: 1, seededAt: now().toISOString(), data: replacementData };
        writeEnvelope(storage, replacement);
        return { ok: true };
      });
    }

    const userAction = pathname.match(/^\/api\/users\/([^/]+)\/enabled$/);
    if (method === 'POST' && userAction) {
      const targetId = decodeRouteId(userAction[1]);
      return mutate((data) => {
        const user = requireUser(data, session, ['technology']);
        const enabled = boolean(requireBody(body).enabled, 'enabled');
        if (targetId === user.id && !enabled) fail(400, 'No puede deshabilitar su propia cuenta', 'SELF_DISABLE');
        const target = requireFound(data.users, 'id', targetId, 'el usuario', 'USER_NOT_FOUND');
        target.enabled = enabled;
        if (!enabled) target.sessionEpoch = (target.sessionEpoch ?? 0) + 1;
        return { ok: true, id: targetId };
      });
    }

    if (!['GET', 'POST'].includes(method)) fail(404, 'No se encontró la ruta', 'NOT_FOUND');
    fail(404, 'No se encontró la ruta', 'NOT_FOUND');
  }

  return {
    async handle(path, method = 'GET', body = {}) {
      try {
        const result = await dispatch(path, method, body);
        const status = result?.status ?? 200;
        return { status, body: result?.body ?? result };
      } catch (error) {
        if (error instanceof DemoError) return { status: error.status, body: { error: error.message, code: error.code } };
        return { status: 500, body: { error: 'Error interno de la demo local', code: 'INTERNAL_ERROR' } };
      }
    },
    storageKey: BUSINESS_KEY,
  };
}
