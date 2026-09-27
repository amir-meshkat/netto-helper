import type { TaxRules } from "../rules";
import { householdTotal, toeslagHousehold, type Home, type HouseholdTotal, type PersonIncome } from "./household";
import { toeslagCliffs, type ToeslagCliff } from "./toeslagen";

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
  amount: number;
}

/**
 * Room for a lijfrente premium this year. `workIncome` is salary after the pension premium plus profit before
 * the zzp deductions. The rule uses last year's income; the page uses this year's as an estimate.
 */
export function jaarruimte(workIncome: number, factorA: number, rules: TaxRules): Jaarruimte {
  const l = rules.lijfrente;
  const income = Math.min(Math.max(0, workIncome), l.maxIncome);
  const premiegrondslag = Math.max(0, income - l.franchise);
  const beforeFactorA = l.rate * premiegrondslag;
  const factorADeduction = l.factorAMultiplier * Math.max(0, factorA);
  const amount = Math.min(l.maxJaarruimte, Math.max(0, beforeFactorA - factorADeduction));
  return { income, premiegrondslag, beforeFactorA, factorADeduction, amount };
}

export interface LijfrenteWhatIf {
  deposit: number;
  room: Jaarruimte;
  /** The part of the deposit that comes off the income: at most the jaarruimte. */
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

/** The effect of a deposit, measured against the household as it is (`before`). */
function effect(people: PersonIncome[], home: Home, p: number, before: HouseholdTotal, room: Jaarruimte, deposit: number, rules: TaxRules): LijfrenteWhatIf {
  const amount = Math.max(0, deposit);
  const deductible = Math.min(amount, room.amount);
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
export function lijfrenteWhatIf(people: PersonIncome[], home: Home, p: number, deposit: number, factorA: number, rules: TaxRules): LijfrenteWhatIf {
  const before = householdTotal(people, home, rules);
  const room = jaarruimte(before.work.people[p]?.incomeTax.workIncome ?? 0, factorA, rules);
  return effect(people, home, p, before, room, deposit, rules);
}

export interface HoneySpot {
  room: Jaarruimte;
  /** The deposit that gives the most back per euro, the largest one when several give as much. Null without room. */
  best: LijfrenteWhatIf | null;
  /** What comes back of every 100 of the honey spot. */
  perHundred: number;
  /** Of the next 100 after the honey spot, what comes back; null when the honey spot is the whole jaarruimte. */
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
/** Steps of the even grid between 0 and the jaarruimte. */
const GRID = 100;

/**
 * The honey spot for person p: which deposit gives the most back per euro. What comes back runs in
 * straight lines between the incomes where a rate changes, so the best deposit is at one of those points,
 * just past a toeslag that drops at once, or at the whole jaarruimte. They are all checked, with an even
 * grid on top for the places where a toeslag runs out.
 */
export function honeySpot(people: PersonIncome[], home: Home, p: number, factorA: number, rules: TaxRules): HoneySpot {
  const before = householdTotal(people, home, rules);
  const person = before.work.people[p];
  const room = jaarruimte(person?.incomeTax.workIncome ?? 0, factorA, rules);
  const none: HoneySpot = { room, best: null, perHundred: 0, afterPerHundred: null, free: null };
  if (!person || room.amount < 1) return none;

  const top = room.amount;
  const income = before.toetsingsinkomen;
  const g = rules.generalCredit;
  const z = rules.toeslagen;
  const partner = people.length > 1;
  const who = partner ? "partner" : "alone";
  // Where the person's own tax rate changes, and where a toeslag starts going down, as a deposit.
  const own = [0, ...rules.box1Brackets.map((b) => b.upTo), g.phaseOutStart, g.phaseOutStart + g.max / g.phaseOutRate].map((edge) => person.taxable - edge);
  const household = [
    z.zorgtoeslag.drempelinkomen,
    z.kindgebondenBudget.threshold[who],
    z.huurtoeslag.incomePoint.one,
    z.huurtoeslag.incomePoint.more,
  ].map((edge) => income - edge);
  // One cent past each toeslag that drops at once, so the household income is under it.
  const allCliffs = toeslagCliffs({ ...toeslagHousehold(before.work, home), income: 0 }, rules);
  const cliffs = allCliffs.map((c) => income - c.at + 1.01);
  const grid = Array.from({ length: GRID }, (_, k) => ((k + 1) / GRID) * top);
  const deposits = [...new Set([Math.min(100, top), ...own, ...household, ...cliffs, ...grid].filter((d) => d > 0.005 && d <= top))].sort((a, b) => a - b);
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
