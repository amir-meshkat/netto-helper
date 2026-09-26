import type { TaxRules } from "../rules";
import type { SideIncome } from "./business";
import { eigenWoning, type EigenWoningResult, type OwnHome } from "./eigen-woning";
import { personNetto, type Job, type PersonResult } from "./person";
import { toeslagen, type Child, type ToeslagHousehold, type ToeslagenResult } from "./toeslagen";

/** One person's income: salary from jobs, plus optional side income as a zzp'er. */
export interface PersonIncome {
  jobs: Job[];
  side?: SideIncome | null;
}

export interface HouseholdResult {
  people: PersonResult[];
  /** Salary gross. */
  gross: number;
  pension: number;
  /** Side income profit (revenue minus costs). */
  profit: number;
  tax: number;
  zvw: number;
  netto: number;
}

/**
 * Yearly netto for a household: each person is taxed on their own income, then everything is added up.
 * `saldo` is the eigen woning saldo of the household; fiscal partners divide it in the most favourable way.
 */
export function householdNetto(people: PersonIncome[], rules: TaxRules, saldo = 0): HouseholdResult {
  const shares = divideSaldo(people, saldo, rules);
  const results = people.map((person, i) => personNetto(person.jobs, rules, person.side ?? null, shares[i] ?? 0));
  const total = (pick: (p: PersonResult) => number) => results.reduce((sum, p) => sum + pick(p), 0);
  return {
    people: results,
    gross: total((p) => p.gross),
    pension: total((p) => p.pension),
    profit: total((p) => p.business?.profit ?? 0),
    tax: total((p) => p.tax),
    zvw: total((p) => p.zvw),
    netto: total((p) => p.netto),
  };
}

/**
 * How fiscal partners divide the eigen woning saldo: any division is allowed, so the one with the least tax
 * together, and half each when nothing is better. Tax changes in straight lines between the incomes where a
 * rate changes, so the best division is always at one of them: half each, all with one partner, or where one
 * partner's taxable income reaches a bracket, the edge of the general credit's phase-out, zero, or the point
 * where their credits stop covering all tax.
 */
export function divideSaldo(people: PersonIncome[], saldo: number, rules: TaxRules): number[] {
  const [a, b] = people;
  if (!a || !b || saldo === 0) return people.map((_, i) => (i === 0 ? saldo : 0));
  const person = (p: PersonIncome) => (share: number) => personNetto(p.jobs, rules, p.side ?? null, share);
  const taxA = person(a);
  const taxB = person(b);
  const lo = Math.min(0, saldo);
  const hi = Math.max(0, saldo);

  // Shares of one person where their tax on the next euro changes: straight lines in between.
  const kinks = (at: (share: number) => PersonResult): number[] => {
    const base = at(0);
    const g = rules.generalCredit;
    const incomes = [
      0,
      ...rules.box1Brackets.map((bracket) => bracket.upTo),
      g.phaseOutStart,
      g.phaseOutStart + g.max / g.phaseOutRate,
      // With entrepreneur deductions, the tariefsaanpassing on a positive saldo starts below the top bracket.
      (rules.box1Brackets.at(-2)?.upTo ?? Infinity) - (base.business?.deductions ?? 0),
    ];
    const shares = incomes.map((income) => income - base.taxable).filter((w) => Number.isFinite(w) && w > lo && w < hi);
    // Where the credits stop covering all tax: tax before the cap is a straight line between the kinks.
    const points = [lo, ...shares, hi].sort((x, y) => x - y);
    const beforeCap = (w: number) => {
      const t = at(w).incomeTax;
      return t.box1.total + t.topBracketAdjustment - t.generalCredit - t.labourCredit;
    };
    const values = points.map(beforeCap);
    for (let i = 1; i < points.length; i++) {
      const [x0, x1, y0, y1] = [points[i - 1] ?? 0, points[i] ?? 0, values[i - 1] ?? 0, values[i] ?? 0];
      if (y0 < 0 !== y1 < 0 && y1 !== y0) shares.push(x0 + ((0 - y0) / (y1 - y0)) * (x1 - x0));
    }
    return shares;
  };

  const candidates = [saldo / 2, saldo, 0, ...kinks(taxA), ...kinks(taxB).map((w) => saldo - w)].filter((w) => w >= lo && w <= hi);
  let best = saldo / 2;
  let bestTax = Infinity;
  for (const share of candidates) {
    const tax = taxA(share).tax + taxB(saldo - share).tax;
    // Only a real saving changes the choice, so equal divisions stay at half each.
    if (tax < bestTax - 0.005) {
      best = share;
      bestTax = tax;
    }
  }
  return [best, saldo - best, ...people.slice(2).map(() => 0)];
}

/** What the toeslagen need to know about the home, besides the income. */
export interface Home {
  /** Savings and investments on 1 January, of the household together. */
  vermogen: number;
  children: Child[];
  /** Bare rent per month, or null when the household does not rent. */
  rent: number | null;
  allYoung: boolean;
  /** The home the household owns and lives in, or null (or missing) when it does not own one. */
  owner?: OwnHome | null;
}

/** The eigen woning of the household, or null without one. */
export function homeEigenWoning(home: Home, rules: TaxRules): EigenWoningResult | null {
  return home.owner ? eigenWoning(home.owner, rules) : null;
}

export interface HouseholdTotal {
  work: HouseholdResult;
  /** The sum of everyone's box 1 taxable income: what the toeslagen count as income. */
  toetsingsinkomen: number;
  toeslagen: ToeslagenResult;
  /** What the childcare on the page costs per year. Kinderopvangtoeslag pays part of it back. */
  childcareCost: number;
  /** The own home in box 1, or null. */
  eigenWoning: EigenWoningResult | null;
  /**
   * What the household has per year: netto from work, plus toeslagen, minus the childcare costs.
   * Kinderopvangtoeslag is not money to spend; it only makes up for part of a bill, so the bill counts too.
   */
  total: number;
}

/**
 * The toeslagen view of a household: combined income, and a toeslagpartner when there are two people.
 * A household that owns its home gets no huurtoeslag.
 */
export function toeslagHousehold(work: HouseholdResult, home: Home): ToeslagHousehold {
  return {
    income: work.people.reduce((sum, p) => sum + p.taxable, 0),
    partner: work.people.length > 1,
    ...home,
    rent: home.owner ? null : home.rent,
  };
}

/** Everything the household has in a year: netto from work, plus toeslagen on the combined income. */
export function householdTotal(people: PersonIncome[], home: Home, rules: TaxRules): HouseholdTotal {
  const woning = homeEigenWoning(home, rules);
  const work = householdNetto(people, rules, woning?.saldo ?? 0);
  const h = toeslagHousehold(work, home);
  const t = toeslagen(h, rules);
  const childcareCost = t.kinderopvang.cost;
  return { work, toetsingsinkomen: h.income, toeslagen: t, childcareCost, eigenWoning: woning, total: work.netto + t.total - childcareCost };
}
