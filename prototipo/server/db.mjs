import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

// node:sqlite remains experimental in Node 24.13; this storage is for the local prototype only.
const DEMO_PASSWORD = 'Jacsa2026!';
const demoCredentials = new Map();

export const demoSeed = {
  insumos: [
    { id: 'INS-NEGRO', name: 'Hilado negro', color: 'Negro', stock: 400, minimum: 100, price: 1_000_000 },
    { id: 'INS-ALMA', name: 'Alma negra', color: 'Negro', stock: 200, minimum: 50, price: 500_000 },
    { id: 'INS-BLANCO', name: 'Poliéster blanco', color: 'Blanco', stock: 1_800, minimum: 100, price: 1_200_000 },
    { id: 'INS-NUCLEO', name: 'Núcleo blanco', color: 'Blanco', stock: 600, minimum: 50, price: 300_000 },
    { id: 'INS-IGNIFUGO', name: 'Hilado ignífugo', color: 'Gris', stock: 1_000, minimum: 100, price: 2_000_000 },
    { id: 'INS-SOPORTE', name: 'Soporte técnico', color: 'Gris', stock: 600, minimum: 50, price: 700_000 },
  ],
  articles: [
    { id: 'ART-001', code: 'ART-001', name: 'Cordón industrial', material: 'Algodón', color: 'Negro', threads: 16, lengthCm: 120, weave: 'Tramado cerrado', unit: 'gruesa', published: 1, machineCost: 3_000, otherCost: 500 },
    { id: 'ART-002', code: 'ART-002', name: 'Cordón de poliéster', material: 'Poliéster', color: 'Blanco', threads: 16, lengthCm: 140, weave: 'Tramado cerrado', unit: '100pares', published: 1, machineCost: 3_000, otherCost: 300 },
    { id: 'ART-003', code: 'ART-003', name: 'Cordón ignífugo especial', material: 'Poliéster ignífugo', color: 'Gris', threads: 32, lengthCm: 120, weave: 'Tramado reforzado', unit: 'unidad', published: 0, machineCost: 3_000, otherCost: 500 },
  ],
};

const users = [
  { id: 'usr-rodrigo', name: 'Rodrigo', username: 'rodrigo', role: 'manager' },
  { id: 'usr-lorena', name: 'Lorena', username: 'lorena', role: 'admin' },
  { id: 'usr-operario', name: 'Operario', username: 'operario', role: 'operator' },
  { id: 'usr-sergio', name: 'Sergio', username: 'sergio', role: 'technology' },
  { id: 'usr-cliente', name: 'Cliente Alfa', username: 'cliente', role: 'client', clientId: 'CLI-ALFA' },
  { id: 'usr-cliente2', name: 'Cliente Beta', username: 'cliente2', role: 'client', clientId: 'CLI-BETA' },
];

const schema = `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    cuit TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('manager','admin','operator','technology','client')),
    client_id TEXT REFERENCES clients(id),
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS insumos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    stock_grams INTEGER NOT NULL CHECK(stock_grams >= 0),
    minimum_grams INTEGER NOT NULL CHECK(minimum_grams >= 0),
    price_cents_per_kg INTEGER NOT NULL CHECK(price_cents_per_kg >= 0),
    price_date TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    material TEXT NOT NULL,
    color TEXT NOT NULL,
    threads INTEGER NOT NULL CHECK(threads > 0),
    length_cm INTEGER NOT NULL CHECK(length_cm > 0),
    weave TEXT NOT NULL,
    unit TEXT NOT NULL,
    published INTEGER NOT NULL CHECK(published IN (0,1)),
    machine_cost_cents INTEGER NOT NULL CHECK(machine_cost_cents >= 0),
    other_cost_cents INTEGER NOT NULL CHECK(other_cost_cents >= 0),
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS article_bom (
    article_id TEXT NOT NULL REFERENCES articles(id),
    insumo_id TEXT NOT NULL REFERENCES insumos(id),
    grams_per_unit INTEGER NOT NULL CHECK(grams_per_unit > 0),
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1)),
    PRIMARY KEY(article_id, insumo_id)
  );
  CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    max_threads INTEGER NOT NULL CHECK(max_threads > 0),
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS article_machines (
    article_id TEXT NOT NULL REFERENCES articles(id),
    machine_id TEXT NOT NULL REFERENCES machines(id),
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1)),
    PRIMARY KEY(article_id, machine_id)
  );
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id),
    article_id TEXT,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    special INTEGER NOT NULL CHECK(special IN (0,1)),
    notes TEXT NOT NULL,
    company TEXT NOT NULL,
    cuit TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Nueva','Cotizada')),
    created_at TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    request_id TEXT REFERENCES requests(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    article_id TEXT NOT NULL REFERENCES articles(id),
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    units INTEGER NOT NULL CHECK(units > 0),
    markup_percent REAL NOT NULL,
    valid_days INTEGER NOT NULL,
    net_cents INTEGER NOT NULL CHECK(net_cents >= 0),
    vat_cents INTEGER NOT NULL CHECK(vat_cents >= 0),
    total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
    status TEXT NOT NULL CHECK(status IN ('Pendiente','Enviada','Aceptada','Rechazada','Vencida')),
    stale_accepted INTEGER NOT NULL DEFAULT 0 CHECK(stale_accepted IN (0,1)),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    quote_id TEXT NOT NULL UNIQUE REFERENCES quotes(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    article_id TEXT NOT NULL REFERENCES articles(id),
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    units INTEGER NOT NULL CHECK(units > 0),
    produced_units INTEGER NOT NULL DEFAULT 0 CHECK(produced_units >= 0),
    status TEXT NOT NULL CHECK(status IN ('Pendiente','En producción','Listo','Entregado','Pendiente de cobro','Cobrado')),
    due_date TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 3,
    machine_id TEXT REFERENCES machines(id),
    quality_checked INTEGER NOT NULL DEFAULT 0 CHECK(quality_checked IN (0,1)),
    created_at TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at, id);
  CREATE TABLE IF NOT EXISTS order_requirements (
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    insumo_id TEXT NOT NULL REFERENCES insumos(id),
    grams_per_unit INTEGER NOT NULL CHECK(grams_per_unit > 0),
    required_grams INTEGER NOT NULL CHECK(required_grams >= 0),
    reserved_grams INTEGER NOT NULL CHECK(reserved_grams >= 0),
    consumed_grams INTEGER NOT NULL CHECK(consumed_grams >= 0),
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1)),
    PRIMARY KEY(order_id, insumo_id)
  );
  CREATE TABLE IF NOT EXISTS order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    at TEXT NOT NULL,
    by_user TEXT NOT NULL,
    action TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    insumo_id TEXT NOT NULL REFERENCES insumos(id),
    grams INTEGER NOT NULL CHECK(grams > 0),
    type TEXT NOT NULL CHECK(type IN ('Ingreso','Consumo')),
    order_id TEXT REFERENCES orders(id),
    memo TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id),
    quote_id TEXT REFERENCES quotes(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    event TEXT NOT NULL,
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL CHECK(channel IN ('Email','WhatsApp')),
    status TEXT NOT NULL CHECK(status IN ('Registrada','Pendiente de reintento')),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK(is_demo IN (0,1)),
    UNIQUE(quote_id, event)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS notifications_order_state_unique
    ON notifications(order_id, event)
    WHERE order_id IS NOT NULL AND event IN ('En producción','Listo','Entregado');
`;

export function nowIso() {
  return new Date().toISOString();
}

export function dayString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function plusDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function inTransaction(db, callback) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Preserve the original database or validation error.
    }
    throw error;
  }
}

function passwordRecord(username) {
  if (!demoCredentials.has(username)) {
    const salt = randomBytes(16);
    const hash = scryptSync(DEMO_PASSWORD, salt, 64);
    demoCredentials.set(username, { salt: salt.toString('hex'), hash: hash.toString('hex') });
  }
  return demoCredentials.get(username);
}

function insertCatalog(db) {
  const created = nowIso();
  const addClient = db.prepare('INSERT OR IGNORE INTO clients (id, name, email, cuit) VALUES (?, ?, ?, ?)');
  addClient.run('CLI-ALFA', 'Cliente Alfa', 'alfa@example.com', '30709999997');
  addClient.run('CLI-BETA', 'Cliente Beta', 'beta@example.com', '30700000008');

  const addInsumo = db.prepare(`INSERT OR IGNORE INTO insumos
    (id, name, color, stock_grams, minimum_grams, price_cents_per_kg, price_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const item of demoSeed.insumos) {
    addInsumo.run(item.id, item.name, item.color, item.stock, item.minimum, item.price, dayString(new Date(created)));
  }

  const addArticle = db.prepare(`INSERT OR IGNORE INTO articles
    (id, code, name, material, color, threads, length_cm, weave, unit, published, machine_cost_cents, other_cost_cents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const article of demoSeed.articles) {
    addArticle.run(article.id, article.code, article.name, article.material, article.color, article.threads,
      article.lengthCm, article.weave, article.unit, article.published, article.machineCost, article.otherCost);
  }

  const addBom = db.prepare('INSERT OR IGNORE INTO article_bom (article_id, insumo_id, grams_per_unit) VALUES (?, ?, ?)');
  for (const [articleId, insumoId, gramsPerUnit] of [
    ['ART-001', 'INS-NEGRO', 2], ['ART-001', 'INS-ALMA', 1],
    ['ART-002', 'INS-BLANCO', 3], ['ART-002', 'INS-NUCLEO', 1],
    ['ART-003', 'INS-IGNIFUGO', 2], ['ART-003', 'INS-SOPORTE', 1],
  ]) addBom.run(articleId, insumoId, gramsPerUnit);

  const addMachine = db.prepare('INSERT OR IGNORE INTO machines (id, name, max_threads) VALUES (?, ?, ?)');
  const addMachineFit = db.prepare('INSERT OR IGNORE INTO article_machines (article_id, machine_id) VALUES (?, ?)');
  for (let i = 1; i <= 24; i += 1) {
    const id = `M-${String(i).padStart(2, '0')}`;
    const maxThreads = i <= 8 ? 16 : i <= 16 ? 24 : 32;
    addMachine.run(id, `Máquina ${String(i).padStart(2, '0')}`, maxThreads);
    if (maxThreads >= 16) addMachineFit.run('ART-001', id);
    if (maxThreads >= 16 && maxThreads <= 24) addMachineFit.run('ART-002', id);
    if (maxThreads >= 32) addMachineFit.run('ART-003', id);
  }

  const addUser = db.prepare(`INSERT OR IGNORE INTO users
    (id, name, username, role, client_id, password_salt, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const user of users) {
    const credential = passwordRecord(user.username);
    addUser.run(user.id, user.name, user.username, user.role, user.clientId ?? null, credential.salt, credential.hash);
  }
}

function insertDemoOrders(db) {
  const createdAt = nowIso();
  const expiresAt = plusDays(new Date(createdAt), 7).toISOString();
  const quoteRows = [
    { id: 'quote-demo-001', number: 'COT-DEMO-001', clientId: 'CLI-ALFA', articleId: 'ART-002', quantity: 1, unit: '100pares', units: 200, net: 1_800_000 },
    { id: 'quote-demo-002', number: 'COT-DEMO-002', clientId: 'CLI-BETA', articleId: 'ART-003', quantity: 5, unit: 'unidad', units: 5, net: 51_250 },
  ];
  const addQuote = db.prepare(`INSERT INTO quotes
    (id, number, client_id, article_id, quantity, unit, units, markup_percent, valid_days,
     net_cents, vat_cents, total_cents, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 25, 7, ?, ?, ?, 'Aceptada', ?, ?)`);
  const addOrder = db.prepare(`INSERT INTO orders
    (id, number, quote_id, client_id, article_id, quantity, unit, units, status, due_date, machine_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)`);
  const addRequirement = db.prepare(`INSERT INTO order_requirements
    (order_id, insumo_id, grams_per_unit, required_grams, reserved_grams, consumed_grams)
    VALUES (?, ?, ?, ?, ?, 0)`);
  const addHistory = db.prepare('INSERT INTO order_history (order_id, at, by_user, action) VALUES (?, ?, ?, ?)');

  for (const [index, row] of quoteRows.entries()) {
    const vat = Number((BigInt(row.net) * 21n + 50n) / 100n);
    addQuote.run(row.id, row.number, row.clientId, row.articleId, row.quantity, row.unit, row.units,
      row.net, vat, row.net + vat, createdAt, expiresAt);
    const orderId = `order-demo-00${index + 1}`;
    const orderNumber = `PED-DEMO-00${index + 1}`;
    const machineId = index === 0 ? 'M-09' : 'M-17';
    addOrder.run(orderId, orderNumber, row.id, row.clientId, row.articleId, row.quantity, row.unit, row.units,
      dayString(plusDays(new Date(createdAt), 7)), machineId, createdAt);
    const bom = db.prepare('SELECT insumo_id, grams_per_unit FROM article_bom WHERE article_id = ?').all(row.articleId);
    for (const requirement of bom) {
      const required = requirement.grams_per_unit * row.units;
      addRequirement.run(orderId, requirement.insumo_id, requirement.grams_per_unit, required, required);
    }
    addHistory.run(orderId, createdAt, 'usr-rodrigo', 'Pedido de demostración creado');
  }
}

function resetCatalog(db) {
  const restore = db.prepare(`UPDATE insumos
    SET name = ?, color = ?, stock_grams = ?, minimum_grams = ?, price_cents_per_kg = ?, price_date = ?
    WHERE id = ?`);
  const priceDate = dayString();
  for (const item of demoSeed.insumos) {
    restore.run(item.name, item.color, item.stock, item.minimum, item.price, priceDate, item.id);
  }
}

export function resetDemoDatabase(db) {
  return inTransaction(db, () => {
    if (!isDemoDatabase(db)) return false;
    db.exec(`DELETE FROM notifications;
      DELETE FROM movements;
      DELETE FROM order_history;
      DELETE FROM order_requirements;
      DELETE FROM orders;
      DELETE FROM quotes;
      DELETE FROM requests;`);
    resetCatalog(db);
    insertDemoOrders(db);
    return true;
  });
}

export function isDemoDatabase(db) {
  const marker = db.prepare("SELECT value FROM meta WHERE key = 'demo_only'").get();
  if (marker?.value !== '1') return false;
  for (const table of ['clients', 'users', 'insumos', 'articles', 'article_bom', 'machines', 'article_machines', 'requests', 'quotes', 'orders', 'order_requirements', 'order_history', 'movements', 'notifications']) {
    const nonDemo = db.prepare(`SELECT 1 FROM ${table} WHERE is_demo <> 1 LIMIT 1`).get();
    if (nonDemo) return false;
  }
  return true;
}

export function openDatabase(dbPath) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  if (dbPath !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(schema);

  const seeded = db.prepare("SELECT value FROM meta WHERE key = 'seeded'").get();
  if (!seeded) {
    inTransaction(db, () => {
      insertCatalog(db);
      insertDemoOrders(db);
      db.prepare("INSERT INTO meta (key, value) VALUES ('seeded', '1')").run();
      db.prepare("INSERT INTO meta (key, value) VALUES ('demo_only', '1')").run();
    });
  }
  return db;
}
