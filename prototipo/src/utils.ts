import type { Article, Insumo, Order, OrderStatus, Quote, Unit } from './types';
import { todayUtc } from './limits';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const integer = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const dateOnly = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function formatCents(cents?: number): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '—';
  return currency.format(cents / 100);
}

export function formatGrams(grams: number): string {
  if (!Number.isFinite(grams)) return '—';
  if (Math.abs(grams) >= 1000) {
    const kg = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(grams / 1000);
    return `${kg} kg · ${integer.format(grams)} g`;
  }
  return `${integer.format(grams)} g`;
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? '—' : dateOnly.format(date);
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : dateTime.format(date);
}

export function unitLabel(unit: Unit | string, quantity?: number): string {
  const plural = quantity !== undefined && quantity !== 1;
  if (unit === 'gruesa') return plural ? 'gruesas' : 'gruesa';
  if (unit === '100pares') {
    if (quantity === undefined) return '100 pares';
    return plural ? 'lotes de 100 pares' : 'lote de 100 pares';
  }
  return plural ? 'unidades' : 'unidad';
}

export function articleName(articles: Article[], id?: string | null): string {
  if (!id) return 'Desarrollo especial';
  return articles.find((article) => article.id === id)?.name ?? `Artículo ${id}`;
}

export function insumoName(insumos: Insumo[], id: string): string {
  return insumos.find((insumo) => insumo.id === id)?.name ?? `Insumo ${id}`;
}

export function clientName(clients: Array<{ id: string; name: string }>, id?: string): string {
  return clients.find((client) => client.id === id)?.name ?? 'Cliente por asociar';
}

/** Single definition of an active order: still in the physical production cycle. */
export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = ['Pendiente', 'En producción', 'Listo'];

export function isActiveOrder(order: Pick<Order, 'status'>): boolean {
  return ACTIVE_ORDER_STATUSES.includes(order.status);
}

export function isDelayed(order: Pick<Order, 'status' | 'dueDate' | 'delayed'>): boolean {
  if (typeof order.delayed === 'boolean') return order.delayed;
  return isActiveOrder(order) && Boolean(order.dueDate) && order.dueDate.slice(0, 10) < todayUtc();
}

export function isBelowMinimum(insumo: Pick<Insumo, 'stockGrams' | 'minGrams' | 'belowMinimum'>): boolean {
  if (typeof insumo.belowMinimum === 'boolean') return insumo.belowMinimum;
  return insumo.stockGrams < insumo.minGrams;
}

const queueStatusRank: Partial<Record<OrderStatus, number>> = { 'En producción': 0, Pendiente: 1, Listo: 2 };

/** Queue order: running first, then priority (1 = most urgent), due date, creation and number. */
export function compareQueue(a: Order, b: Order): number {
  return (queueStatusRank[a.status] ?? 3) - (queueStatusRank[b.status] ?? 3)
    || a.priority - b.priority
    || a.dueDate.localeCompare(b.dueDate)
    || a.createdAt.localeCompare(b.createdAt)
    || a.number.localeCompare(b.number, 'es');
}

export function orderReadiness(order: Order): boolean {
  return order.requirements.every((requirement) => requirement.reservedGrams + requirement.consumedGrams >= requirement.requiredGrams);
}

export function nextOrderState(status: OrderStatus): OrderStatus | null {
  if (status === 'Listo') return 'Entregado';
  if (status === 'Entregado') return 'Pendiente de cobro';
  if (status === 'Pendiente de cobro') return 'Cobrado';
  return null;
}

export function parseCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '');
  const match = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(2, '0'));
  const cents = whole * 100 + fraction;
  return Number.isSafeInteger(cents) ? cents : null;
}

export function dateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function stateClass(value: string): string {
  const normalized = value.toLocaleLowerCase('es');
  if (normalized.includes('pendiente de reintento') || normalized === 'vencida' || normalized.includes('faltante')) return 'tone-alert';
  if (normalized === 'enviada' || normalized === 'en producción' || normalized.includes('pendiente')) return 'tone-warm';
  if (normalized === 'aceptada' || normalized === 'listo' || normalized === 'cobrado' || normalized === 'registrada') return 'tone-good';
  if (normalized === 'rechazada') return 'tone-muted';
  return 'tone-neutral';
}

export function articleById(articles: Article[], id: string): Article | undefined {
  return articles.find((article) => article.id === id);
}
