import { t } from "../i18n";

const wholeEuros = new Intl.NumberFormat(t.meta.numberLocale, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroCents = new Intl.NumberFormat(t.meta.numberLocale, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentage = new Intl.NumberFormat(t.meta.numberLocale, {
  style: "percent",
  maximumFractionDigits: 3,
});

/** "€2,612". Rounded to whole euros, never "-€0". */
export function euros(amount: number): string {
  return wholeEuros.format(Math.round(amount) || 0);
}

/** "€59.80" */
export function eurosCents(amount: number): string {
  return euroCents.format(Math.round(amount * 100) / 100 || 0);
}

/** "35.75%" from 0.3575 */
export function percent(rate: number): string {
  return percentage.format(rate);
}

/**
 * Splits amounts into whole euros of every €100, adding up to exactly 100
 * (largest remainder method). Used for "of every €100 you earn" and the 100 square grid.
 */
export function splitHundred(amounts: number[]): number[] {
  const total = amounts.reduce((sum, a) => sum + Math.max(0, a), 0);
  if (total <= 0) return amounts.map(() => 0);
  const exact = amounts.map((a) => (Math.max(0, a) / total) * 100);
  const parts = exact.map(Math.floor);
  const missing = 100 - parts.reduce((sum, p) => sum + p, 0);
  const byRemainder = exact.map((x, i) => ({ i, rest: x - Math.floor(x) })).sort((a, b) => b.rest - a.rest);
  for (let k = 0; k < missing; k++) {
    const target = byRemainder[k % byRemainder.length];
    if (target) parts[target.i] = (parts[target.i] ?? 0) + 1;
  }
  return parts;
}
