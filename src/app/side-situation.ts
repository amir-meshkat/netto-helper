import type { SideIncome } from "../engine/business";
import type { Job } from "../engine/person";
import { sideIncomeValue, type SideIncomeValue } from "../engine/side-income";
import type { TaxRules } from "../rules";
import { toEngineJob } from "../ui/job-input";
import { toEngineSide } from "../ui/side-input";
import type { PersonInput } from "./state";

// What the side income section shows. Kept free of the DOM so it can be tested.

/** A difference below this many euros per month is "it hardly matters who earns it". */
export const HARDLY_MATTERS = 5;

/**
 * One side income in the household. For a couple it is worked out for both partners,
 * as if each of them earned it, to answer "who should earn it".
 */
export interface OneSideIncome {
  kind: "one";
  /** The person who has the side income now. */
  owner: number;
  side: SideIncome;
  /** Everyone's salary, and the value of the side income to each of them. */
  mains: Job[];
  values: SideIncomeValue[];
  /** Everyone's share of the eigen woning saldo, as divided now. */
  woning: number[];
  /** Who keeps more of it; null for one person, or when the difference hardly matters. */
  better: number | null;
  /** Extra netto per month when the better person earns it. */
  difference: number;
}

/** Both partners have side income: each one's own, and nothing to compare. */
export interface EachSideIncome {
  kind: "each";
  /** The people with side income. `sides` and `values` follow the same order. */
  owners: number[];
  sides: SideIncome[];
  /** The value of each owner's own side income to them. */
  values: SideIncomeValue[];
}

export type SideSituation = OneSideIncome | EachSideIncome;

/**
 * Null when nobody has side income with a profit yet. `woning` is each person's share of the eigen
 * woning saldo as the household divides it now; it stays the same whoever earns the side income.
 */
export function sideSituation(people: PersonInput[], rules: TaxRules, woning: number[] = []): SideSituation | null {
  const mains = people.map((p) => toEngineJob(p.job));
  const owned = people.flatMap((p, i) => {
    const side = p.side ? toEngineSide(p.side) : null;
    const main = mains[i];
    return side && main && side.revenue - side.costs > 0 ? [{ i, main, side }] : [];
  });

  const [first] = owned;
  if (!first) return null;

  if (owned.length > 1) {
    return {
      kind: "each",
      owners: owned.map((o) => o.i),
      sides: owned.map((o) => o.side),
      values: owned.map((o) => sideIncomeValue([o.main], o.side, rules, woning[o.i] ?? 0)),
    };
  }

  const values = mains.map((main, i) => sideIncomeValue([main], first.side, rules, woning[i] ?? 0));
  const [a = 0, b = 0] = values.map((v) => v.kept / 12);
  const difference = values.length > 1 ? Math.abs(a - b) : 0;
  const better = values.length < 2 || difference < HARDLY_MATTERS ? null : b > a ? 1 : 0;
  return { kind: "one", owner: first.i, side: first.side, mains, values, woning: mains.map((_, i) => woning[i] ?? 0), better, difference };
}

/** Household netto per year if person `i` earned the one side income, and the other partner did not. */
export function householdIfEarns(sit: OneSideIncome, i: number): number {
  return sit.values.reduce((sum, v, j) => sum + (j === i ? v.nettoWith : v.nettoWithout), 0);
}
