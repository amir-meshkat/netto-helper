import type { TaxRules } from "../rules";
import { householdTotal, toeslagHousehold, type Home, type HouseholdTotal, type PersonIncome } from "./household";
import { personNetto } from "./person";
import { toeslagCliffs, toeslagRunOut, type ToeslagCliff } from "./toeslagen";

// Lijfrente: money you put away for your own pension comes off box 1 income, as long as it fits in the
// jaarruimte. For the what-if section: what a deposit would give back this year. See docs/lijfrente-2026.md.

export interface Jaarruimte {
  /** Income from work that counts: up to the maximum income. */
  income: number;
  /** That income minus the AOW-franchise (premiegrondslag). */
  premiegrondslag: number;
  /** The room before factor A. */
  beforeFactorA: number;
  /** What factor A takes off. */
  factorADeduction: number;
  /** The jaarruimte itself. */
  amount: number;
  /** Unused room from the ten years before (reserveringsruimte), as far as it counts this year. */
  reservering: number;
  /** All the room this year: jaarruimte plus reserveringsruimte. */
  total: number;
}

/**
 * Room for a lijfrente premium this year. `workIncome` is last year's salary after the pension premium plus
 * profit before the zzp deductions; `reservering` is unused room from the ten years before.
 */
export function jaarruimte(workIncome: number, factorA: number, rules: TaxRules, reservering = 0): Jaarruimte {
  const l = rules.lijfrente;
  const income = Math.min(Math.max(0, workIncome), l.maxIncome);
  const premiegrondslag = Math.max(0, income - l.franchise);
  const beforeFactorA = l.rate * premiegrondslag;
  const factorADeduction = l.factorAMultiplier * Math.max(0, factorA);
  const amount = Math.min(l.maxJaarruimte, Math.max(0, beforeFactorA - factorADeduction));
  const usable = Math.min(Math.max(0, reservering), l.maxReserveringsruimte);
  return { income, premiegrondslag, beforeFactorA, factorADeduction, amount, reservering: usable, total: amount + usable };
}

/** What a person can add about their room, all optional. */
export interface LijfrenteExtras {
  /** Pension built at work last year, from the UPO. */
  factorA?: number;
  /** Last year's income from work; missing or null: this year's, as an estimate. */
  lastYear?: number | null;
  /** Unused room from the ten years before. */
  reservering?: number;
}

/** The room of person p, from last year's income when it is given. */
function roomOf(before: HouseholdTotal, p: number, extras: LijfrenteExtras, rules: TaxRules): Jaarruimte {
  const income = extras.lastYear ?? before.work.people[p]?.incomeTax.workIncome ?? 0;
  return jaarruimte(income, extras.factorA ?? 0, rules, extras.reservering ?? 0);
}

export interface LijfrenteWhatIf {
  deposit: number;
  room: Jaarruimte;
  /** The part of the deposit that comes off the income: at most the room (jaarruimte plus reserveringsruimte). */
  deductible: number;
  /** Less income tax per year, for the household. */
  taxLower: number;
  /** More toeslagen per year, because the toetsingsinkomen goes down. */
  toeslagenUp: number;
  /** What comes back this year: less tax plus more toeslagen. */
  back: number;
  /** What the deposit costs now: the deposit minus what comes back. */
  cost: number;
}

/**
 * The deposit where person p's tax reaches zero, because the credits cover all of it from there. Tax before
 * the credits are capped runs in straight lines between the `points`, so the crossing is found between two.
 */
function zeroTaxDeposit(people: PersonIncome[], p: number, woning: number, points: number[], rules: TaxRules): number[] {
  const person = people[p];
  if (!person) return [];
  const beforeCap = (d: number) => {
    const t = personNetto(person.jobs, rules, person.side ?? null, woning, (person.lijfrente ?? 0) + d).incomeTax;
    return t.box1.total + t.topBracketAdjustment - t.generalCredit - t.labourCredit;
  };
  const sorted = [...new Set(points)].sort((a, b) => a - b);
  const values = sorted.map(beforeCap);
  for (let i = 1; i < sorted.length; i++) {
    const [x0, x1, y0, y1] = [sorted[i - 1] ?? 0, sorted[i] ?? 0, values[i - 1] ?? 0, values[i] ?? 0];
    if (y0 > 0 && y1 <= 0 && y0 !== y1) return [x0 + (y0 / (y0 - y1)) * (x1 - x0)];
  }
  return [];
}

/** The effect of a deposit, measured against the household as it is (`before`). */
function effect(people: PersonIncome[], home: Home, p: number, before: HouseholdTotal, room: Jaarruimte, deposit: number, rules: TaxRules): LijfrenteWhatIf {
  const amount = Math.max(0, deposit);
  const deductible = Math.min(amount, room.total);
  const after = householdTotal(
    people.map((person, i) => (i === p ? { ...person, lijfrente: (person.lijfrente ?? 0) + deductible } : person)),
    home,
    rules,
  );
  const taxLower = before.work.tax - after.work.tax;
  const toeslagenUp = after.toeslagen.total - before.toeslagen.total;
  const back = taxLower + toeslagenUp;
  return { deposit: amount, room, deductible, taxLower, toeslagenUp, back, cost: amount - back };
}

/** What if person p puts `deposit` in a lijfrente this year: what comes back through tax and toeslagen. */
export function lijfrenteWhatIf(people: PersonIncome[], home: Home, p: number, deposit: number, extras: LijfrenteExtras, rules: TaxRules): LijfrenteWhatIf {
  const before = householdTotal(people, home, rules);
  return effect(people, home, p, before, roomOf(before, p, extras, rules), deposit, rules);
}

export interface HoneySpot {
  room: Jaarruimte;
  /** The deposit that gives the most back per euro, the largest one when several give as much. Null without room. */
  best: LijfrenteWhatIf | null;
  /** What comes back of every 100 of the honey spot. */
  perHundred: number;
  /** Of the next 100 after the honey spot, what comes back; null when the honey spot is all of the room. */
  afterPerHundred: number | null;
  /**
   * When a deposit leaves the household with more money than it costs (just under a toeslag that drops at
   * once): the deposit with the most gain, and the most that can go in while the household keeps at least
   * as much as now. Null when no deposit does that.
   */
  free: { best: LijfrenteWhatIf; upTo: number; toeslag: ToeslagCliff["toeslag"] } | null;
}

/** Differences below this, per euro, count as the same rate: a tenth of a cent per 100. */
const SAME_RATE = 0.00001;
/** Steps of an even grid between 0 and the room: a safety net, the exact points below do the work. */
const GRID = 16;

/**
 * The honey spot for person p: which deposit gives the most back per euro. What comes back runs in
 * straight lines between the incomes where a rate changes, so the best deposit is at one of those points,
 * just past a toeslag that drops at once, or at all of the room. The points: the person's tax zones, where
 * their tax reaches zero, where each toeslag starts going down or runs out, and every drop at once. A small
 * even grid is a safety net for the rest (such as a mortgage division that shifts).
 */
export function honeySpot(people: PersonIncome[], home: Home, p: number, extras: LijfrenteExtras, rules: TaxRules): HoneySpot {
  const before = householdTotal(people, home, rules);
  const person = before.work.people[p];
  const room = roomOf(before, p, extras, rules);
  const none: HoneySpot = { room, best: null, perHundred: 0, afterPerHundred: null, free: null };
  if (!person || room.total < 1) return none;

  const top = room.total;
  const income = before.toetsingsinkomen;
  const g = rules.generalCredit;
  const z = rules.toeslagen;
  const partner = people.length > 1;
  const who = partner ? "partner" : "alone";
  // Where the person's own tax rate changes, and where a toeslag starts going down, as a deposit.
  const own = [0, ...rules.box1Brackets.map((b) => b.upTo), g.phaseOutStart, g.phaseOutStart + g.max / g.phaseOutRate].map((edge) => person.taxable - edge);
  const toeslagHome = toeslagHousehold(before.work, home);
  const household = [
    z.zorgtoeslag.drempelinkomen,
    z.kindgebondenBudget.threshold[who],
    z.huurtoeslag.incomePoint.one,
    z.huurtoeslag.incomePoint.more,
    ...toeslagRunOut(toeslagHome, rules),
  ].map((edge) => income - edge);
  // One cent past each toeslag that drops at once, so the household income is under it.
  const allCliffs = toeslagCliffs({ ...toeslagHome, income: 0 }, rules);
  const cliffs = allCliffs.map((c) => income - c.at + 1.01);
  const grid = Array.from({ length: GRID }, (_, k) => ((k + 1) / GRID) * top);
  const points = [Math.min(100, top), top, ...own, ...household, ...cliffs, ...grid].filter((d) => d > 0.005 && d <= top);
  const zero = zeroTaxDeposit(people, p, person.woning, [0, ...points], rules);
  const deposits = [...new Set([...points, ...zero])].sort((a, b) => a - b);
  const results = deposits.map((d) => effect(people, home, p, before, room, d, rules));

  // Most back per euro; on a tie, the largest deposit.
  let best = results[0] ?? null;
  for (const r of results) {
    if (best && r.back / r.deposit >= best.back / best.deposit - SAME_RATE) best = r;
  }
  if (!best) return none;
  const next = best.deposit < top - 0.5 ? effect(people, home, p, before, room, Math.min(top, best.deposit + 100), rules) : null;
  const afterPerHundred = next ? ((next.back - best.back) / (next.deposit - best.deposit)) * 100 : null;

  // The free spot: a deposit that gives back more than it costs.
  const gain = (r: LijfrenteWhatIf) => r.back - r.deposit;
  const winners = results.filter((r) => gain(r) >= 0);
  let free: HoneySpot["free"] = null;
  const most = winners.reduce<LijfrenteWhatIf | null>((m, r) => (!m || gain(r) > gain(m) ? r : m), null);
  if (most) {
    // The largest deposit that still does not cost the household anything: past the last winner, the gain
    // only goes down until the next drop, so halve the gap to the next deposit checked.
    const last = winners.at(-1) ?? most;
    let low = last.deposit;
    let high = deposits.find((d) => d > low) ?? low;
    if (high > low) {
      for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        if (gain(effect(people, home, p, before, room, mid, rules)) >= 0) low = mid;
        else high = mid;
      }
    }
    // The toeslag that is back once the income is under its drop: the nearest one the deposit passes.
    const passed = allCliffs.filter((c) => c.at <= income && c.at > income - most.deposit).at(-1);
    free = { best: most, upTo: low, toeslag: passed?.toeslag ?? "kinderopvang" };
  }
  return { room, best, perHundred: (best.back / best.deposit) * 100, afterPerHundred, free };
}
