import type { TaxRules } from "../rules";
import { householdTotal, type Home, type PersonIncome } from "./household";

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

/** What if person p puts `deposit` in a lijfrente this year: what comes back through tax and toeslagen. */
export function lijfrenteWhatIf(people: PersonIncome[], home: Home, p: number, deposit: number, factorA: number, rules: TaxRules): LijfrenteWhatIf {
  const before = householdTotal(people, home, rules);
  const room = jaarruimte(before.work.people[p]?.incomeTax.workIncome ?? 0, factorA, rules);
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
