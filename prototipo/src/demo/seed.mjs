const DEMO_PASSWORD = 'Jacsa2026!';

const UNIT_FACTORS = Object.freeze({ unidad: 1, gruesa: 144, '100pares': 200 });

function plusDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function vatFor(netCents) {
  return Number((BigInt(netCents) * 21n + 50n) / 100n);
}

function quoteFor({ id, number, clientId, articleId, quantity, unit, netCents }, createdAt, expiresAt) {
  const vatCents = vatFor(netCents);
  return {
    id,
    number,
    clientId,
    articleId,
    quantity,
    unit,
    units: quantity * UNIT_FACTORS[unit],
    markupPercent: 25,
    validDays: 7,
    netCents,
    vatCents,
    totalCents: netCents + vatCents,
    status: 'Aceptada',
    createdAt,
    expiresAt,
  };
}

export function createSeed(now = new Date()) {
  const createdAt = now.toISOString();
  const expiresAt = plusDays(now, 7).toISOString();
  const dueDate = plusDays(now, 7).toISOString().slice(0, 10);
  const users = [
    { id: 'usr-rodrigo', name: 'Rodrigo', username: 'rodrigo', role: 'manager', password: DEMO_PASSWORD, enabled: true },
    { id: 'usr-lorena', name: 'Lorena', username: 'lorena', role: 'admin', password: DEMO_PASSWORD, enabled: true },
    { id: 'usr-operario', name: 'Operario', username: 'operario', role: 'operator', password: DEMO_PASSWORD, enabled: true },
    { id: 'usr-sergio', name: 'Sergio', username: 'sergio', role: 'technology', password: DEMO_PASSWORD, enabled: true },
    { id: 'usr-cliente', name: 'Cliente Alfa', username: 'cliente', role: 'client', clientId: 'CLI-ALFA', password: DEMO_PASSWORD, enabled: true },
    { id: 'usr-cliente2', name: 'Cliente Beta', username: 'cliente2', role: 'client', clientId: 'CLI-BETA', password: DEMO_PASSWORD, enabled: true },
  ];
  const insumos = [
    { id: 'INS-NEGRO', name: 'Hilado negro', color: 'Negro', stockGrams: 400, minGrams: 100, priceCentsPerKg: 1_000_000, priceDate: now.toISOString().slice(0, 10) },
    { id: 'INS-ALMA', name: 'Alma negra', color: 'Negro', stockGrams: 200, minGrams: 50, priceCentsPerKg: 500_000, priceDate: now.toISOString().slice(0, 10) },
    { id: 'INS-BLANCO', name: 'Poliéster blanco', color: 'Blanco', stockGrams: 1_800, minGrams: 100, priceCentsPerKg: 1_200_000, priceDate: now.toISOString().slice(0, 10) },
    { id: 'INS-NUCLEO', name: 'Núcleo blanco', color: 'Blanco', stockGrams: 600, minGrams: 50, priceCentsPerKg: 300_000, priceDate: now.toISOString().slice(0, 10) },
    { id: 'INS-IGNIFUGO', name: 'Hilado ignífugo', color: 'Gris', stockGrams: 1_000, minGrams: 100, priceCentsPerKg: 2_000_000, priceDate: now.toISOString().slice(0, 10) },
    { id: 'INS-SOPORTE', name: 'Soporte técnico', color: 'Gris', stockGrams: 600, minGrams: 50, priceCentsPerKg: 700_000, priceDate: now.toISOString().slice(0, 10) },
  ];
  const articles = [
    { id: 'ART-001', code: 'ART-001', name: 'Cordón industrial', material: 'Algodón', color: 'Negro', threads: 16, lengthCm: 120, weave: 'Tramado cerrado', unit: 'gruesa', published: true, machineCostCents: 3_000, otherCostCents: 500, bom: [{ insumoId: 'INS-NEGRO', gramsPerUnit: 2 }, { insumoId: 'INS-ALMA', gramsPerUnit: 1 }], machineIds: Array.from({ length: 24 }, (_, index) => `M-${String(index + 1).padStart(2, '0')}`) },
    { id: 'ART-002', code: 'ART-002', name: 'Cordón de poliéster', material: 'Poliéster', color: 'Blanco', threads: 16, lengthCm: 140, weave: 'Tramado cerrado', unit: '100pares', published: true, machineCostCents: 3_000, otherCostCents: 300, bom: [{ insumoId: 'INS-BLANCO', gramsPerUnit: 3 }, { insumoId: 'INS-NUCLEO', gramsPerUnit: 1 }], machineIds: Array.from({ length: 16 }, (_, index) => `M-${String(index + 1).padStart(2, '0')}`) },
    { id: 'ART-003', code: 'ART-003', name: 'Cordón ignífugo especial', material: 'Poliéster ignífugo', color: 'Gris', threads: 32, lengthCm: 120, weave: 'Tramado reforzado', unit: 'unidad', published: false, machineCostCents: 3_000, otherCostCents: 500, bom: [{ insumoId: 'INS-IGNIFUGO', gramsPerUnit: 2 }, { insumoId: 'INS-SOPORTE', gramsPerUnit: 1 }], machineIds: Array.from({ length: 8 }, (_, index) => `M-${String(index + 17).padStart(2, '0')}`) },
  ];
  const quotes = [
    quoteFor({ id: 'quote-demo-001', number: 'COT-DEMO-001', clientId: 'CLI-ALFA', articleId: 'ART-002', quantity: 1, unit: '100pares', netCents: 1_800_000 }, createdAt, expiresAt),
    quoteFor({ id: 'quote-demo-002', number: 'COT-DEMO-002', clientId: 'CLI-BETA', articleId: 'ART-003', quantity: 5, unit: 'unidad', netCents: 51_250 }, createdAt, expiresAt),
  ];
  const orders = quotes.map((quote, index) => {
    const article = articles.find((item) => item.id === quote.articleId);
    return {
      id: `order-demo-00${index + 1}`,
      number: `PED-DEMO-00${index + 1}`,
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
      machineId: index === 0 ? 'M-09' : 'M-17',
      qualityChecked: false,
      createdAt,
      requirements: article.bom.map((item) => ({
        insumoId: item.insumoId,
        requiredGrams: item.gramsPerUnit * quote.units,
        reservedGrams: item.gramsPerUnit * quote.units,
        consumedGrams: 0,
        shortageGrams: 0,
        gramsPerUnit: item.gramsPerUnit,
      })),
      history: [{ at: createdAt, by: 'usr-rodrigo', action: 'Pedido de demostración creado' }],
    };
  });

  return {
    users,
    clients: [
      { id: 'CLI-ALFA', name: 'Cliente Alfa', email: 'alfa@example.com', cuit: '30709999997' },
      { id: 'CLI-BETA', name: 'Cliente Beta', email: 'beta@example.com', cuit: '30700000008' },
    ],
    articles,
    insumos,
    machines: Array.from({ length: 24 }, (_, index) => {
      const number = index + 1;
      return { id: `M-${String(number).padStart(2, '0')}`, name: `Máquina ${String(number).padStart(2, '0')}`, maxThreads: number <= 8 ? 16 : number <= 16 ? 24 : 32 };
    }),
    requests: [],
    quotes,
    orders,
    notifications: [],
    movements: [],
    settings: { markupPercent: 25, validDays: 7, staleDays: 15 },
  };
}
