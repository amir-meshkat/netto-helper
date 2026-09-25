import type { TaxRules } from "../rules";
import type { SideIncome } from "./business";
import { NO_PENSION, incomeTax, personNetto, type Job } from "./person";

export interface TaxZone {
  from: number;
  upTo: number;
  /** Tax on the next euro inside this zone: 0.4 means 40 cents of every extra euro. */
  rate: number;
}

/** Of the next `amount` euros of taxable income, the part you keep after income tax. */
export function keptOfNext(taxableIncome: number, rules: TaxRules, amount = 100): number {
  const tax = (income: number) => incomeTax(income, rules).tax;
  return amount - (tax(taxableIncome + amount) - tax(taxableIncome));
}

/**
 * Of the next `amount` euros of salary, the part a person keeps. Unlike keptOfNext, this also
 * counts side income: its profit changes the credits and the room left for the Zvw contribution.
 */
export function keptOfNextSalary(jobs: Job[], side: SideIncome | null, rules: TaxRules, amount = 100): number {
  const extra: Job = { monthlyGross: amount / 12, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION };
  return personNetto([...jobs, extra], rules, side).netto - personNetto(jobs, rules, side).netto;
}

/**
 * Income ranges where the tax on the next euro stays the same, computed from the rules.
 * The rate only changes at a bracket boundary, a credit threshold, a credit reaching zero,
 * or the income where the credits stop covering all tax.
 */
export function taxZones(rules: TaxRules): TaxZone[] {
  const tax = (income: number) => incomeTax(income, rules).tax;

  const points = new Set<number>([0, firstTaxedIncome(tax)]);
  for (const bracket of rules.box1Brackets) points.add(bracket.upTo);
  const general = rules.generalCredit;
  points.add(general.phaseOutStart);
  points.add(general.phaseOutStart + general.max / general.phaseOutRate);
  for (const segment of rules.labourCredit) {
    points.add(segment.from);
    if (segment.rate < 0) points.add(segment.from - segment.base / segment.rate);
  }

  const bounds = [...points].filter(Number.isFinite).sort((a, b) => a - b);
  const zones: TaxZone[] = [];
  bounds.forEach((from, i) => {
    const upTo = bounds[i + 1] ?? Infinity;
    const rate = rateBetween(tax, from, upTo);
    const previous = zones.at(-1);
    if (previous && Math.abs(previous.rate - rate) < 1e-9) previous.upTo = upTo;
    else zones.push({ from, upTo, rate });
  });
  return zones;
}

/** The zone that contains this income. */
export function zoneAt(zones: TaxZone[], income: number): TaxZone {
  const zone = zones.find((z) => income < z.upTo) ?? zones.at(-1);
  if (!zone) throw new Error("zoneAt needs at least one zone");
  return zone;
}

/** Tax on the next euro between two points, measured away from the edges, where the labour credit table jumps a few cents. */
function rateBetween(tax: (income: number) => number, from: number, upTo: number): number {
  const width = upTo === Infinity ? 1_000 : upTo - from;
  const low = from + width / 4;
  const high = from + (width * 3) / 4;
  return (tax(high) - tax(low)) / (high - low);
}

/** Lowest income with tax above zero. Tax never goes down as income goes up, so halving the search range works. */
function firstTaxedIncome(tax: (income: number) => number): number {
  let low = 0;
  let high = 1_000;
  while (tax(high) === 0) {
    if (high > 10_000_000) return Infinity;
    low = high;
    high *= 2;
  }
  for (let step = 0; step < 60; step++) {
    const middle = (low + high) / 2;
    if (tax(middle) > 0) high = middle;
    else low = middle;
  }
  return high;
}
