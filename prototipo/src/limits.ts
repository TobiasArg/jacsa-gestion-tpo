import type { Unit } from './types';

// Mirrors the validation in server/app.mjs so forms reject what the API would reject.
export const UNIT_FACTORS: Record<Unit, number> = { unidad: 1, gruesa: 144, '100pares': 200 };
export const MAX_UNITS = 1_000_000;
export const MAX_QUANTITY = 1_000_000;
export const MARKUP_MAX = 500;
export const VALID_DAYS_MAX = 365;
export const PRIORITY_MIN = 1;
export const PRIORITY_MAX = 10;
export const RECEIVE_GRAMS_MAX = 100_000_000;
export const PRICE_CENTS_MAX = 1_000_000_000;
export const MEMO_MAX = 500;
export const COMPANY_MAX = 120;
export const CUIT_MAX = 16;
export const EMAIL_MAX = 254;
export const PHONE_MIN = 7;
export const PHONE_MAX = 30;
export const NOTES_API_MAX = 1_000;
// Special requests prepend the configuration summary, so the user's own text keeps headroom.
export const NOTES_USER_MAX = 800;
export const NO_MARKUP_HINT = 'No se admiten los caracteres < >.';

export function maxQuantityFor(unit: Unit): number {
  return Math.min(MAX_QUANTITY, Math.floor(MAX_UNITS / UNIT_FACTORS[unit]));
}

export function hasMarkup(value: string): boolean {
  return /[<>]/.test(value);
}

/** Server dates (dueDate, notPast) are compared against the UTC day. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
